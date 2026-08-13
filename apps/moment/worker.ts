import { Hono } from "hono";
import { z } from "zod";
import { getSession } from "void/auth";
import { createOwnerGuard, requestIsOwner, type WorkerEnv } from "~/lib/server/access";
import { readManifest, writeManifest, deleteManifest, type PhotoManifest } from "~/lib/kv";
import {
  createPhotoFromUpload,
  deletePhoto,
  getPhoto,
  listPhotos,
  updatePhoto,
} from "~/lib/server/photos/service";
import { getAllTags, renameTag, deleteTag } from "~/lib/server/photos/repository";
import {
  createHaulItem,
  deleteHaulItem,
  getHaulItem,
  listAllHaulItems,
  updateHaulItem,
  uploadHaulImage,
} from "~/lib/server/haul/service";
import {
  convertWishlistItem,
  createWishlistItem,
  deleteWishlistItem,
  getWishlistItem,
  listAllWishlistItems,
  updateWishlistItem,
  uploadWishlistImage,
} from "~/lib/server/wishlist/service";
import { goodsFormSchema, wishFormSchema } from "~/types/haul";
import { photoUpdateSchema } from "~/types/photo";
import { renderOgImage, renderOgPng, type OgImageOptions } from "~/lib/server/og";
import { getOgImageVersion, readOgImageKv, writeOgImageKv } from "~/lib/server/og/cache";
import {
  createMessage,
  deleteMessage,
  getMessageOwner,
  listMessages,
  updateMessage,
} from "~/lib/server/messages/repository";
import type { MessageCursor, WorkerBindings } from "~/types";
import { PUBLIC_PAGE_META, SITE_NAME, type PublicPageKey } from "~/lib/seo";

const app = new Hono<WorkerEnv>();
const ownerOnly = createOwnerGuard();
const uploadOwnerOnly = createOwnerGuard("Upload not configured");

const messageCreateSchema = z.object({
  content: z.string().trim().min(1).max(1000),
  parentId: z.string().uuid().optional(),
});

const messageUpdateSchema = messageCreateSchema.pick({ content: true });

const messageCursorSchema = z.string().transform((value, context): MessageCursor => {
  const separator = value.lastIndexOf("~");
  const createdAt = separator > 0 ? value.slice(0, separator) : "";
  const id = separator > 0 ? value.slice(separator + 1) : "";
  if (Number.isNaN(Date.parse(createdAt)) || !z.string().uuid().safeParse(id).success) {
    context.addIssue({ code: "custom", message: "invalid cursor" });
    return z.NEVER;
  }
  return { createdAt, id };
});

const messageListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(20),
  cursor: messageCursorSchema.optional(),
});

interface PageMeta {
  title: string;
  description: string;
  canonical: string;
  image?: string;
  imageWidth?: number;
  imageHeight?: number;
  type?: "website" | "article";
  robots?: string;
}

function absoluteUrl(origin: string, path: string): string {
  return new URL(path, origin).href;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 32_768) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 32_768));
  }
  return btoa(binary);
}

function ogImageUrl(origin: string, path: string): string {
  return absoluteUrl(origin, `${path}?v=${getOgImageVersion()}`);
}

function staticPageMeta(origin: string, key: PublicPageKey): PageMeta {
  const page = PUBLIC_PAGE_META[key];
  return {
    title: page.title,
    description: page.description,
    canonical: absoluteUrl(origin, page.path),
    image: ogImageUrl(origin, page.image),
    imageWidth: 1200,
    imageHeight: 630,
  };
}

async function resolvePageMeta(url: URL, env: WorkerBindings): Promise<PageMeta> {
  const path = url.pathname.replace(/\/$/, "") || "/";
  const privatePath =
    path === "/upload" ||
    path === "/collection/add" ||
    path.endsWith("/edit") ||
    path === "/haul/add" ||
    path === "/wish/add";

  if (privatePath) {
    return {
      title: `Private workspace — ${SITE_NAME}`,
      description: "A private editing workspace.",
      canonical: absoluteUrl(url.origin, path),
      robots: "noindex, nofollow, noarchive",
    };
  }

  if (path === "/") return staticPageMeta(url.origin, "gallery");
  if (path === "/journey") return staticPageMeta(url.origin, "journey");
  if (path === "/messages" || path === "/snapshot") {
    return staticPageMeta(url.origin, "guestbook");
  }

  const photoMatch = path.match(/^\/photos\/([^/]+)$/);
  if (photoMatch?.[1]) {
    const photo = await getPhoto(env.DB, decodeURIComponent(photoMatch[1]));
    if (photo) {
      const title = photo.title.trim() || "Untitled moment";
      return {
        title: `${title} — ${SITE_NAME}`,
        description: (photo.description || `A photographed moment from ${SITE_NAME}.`).slice(
          0,
          160,
        ),
        canonical: absoluteUrl(url.origin, `/photos/${photo.id}`),
        image: absoluteUrl(url.origin, photo.url),
        imageWidth: photo.width || undefined,
        imageHeight: photo.height || undefined,
        type: "article",
      };
    }
  }

  if (path === "/haul") return staticPageMeta(url.origin, "haul");
  if (path === "/wish") return staticPageMeta(url.origin, "wishlist");

  if (path === "/collection") {
    const view = url.searchParams.get("view") === "wishlist" ? "wishlist" : "haul";
    const itemId = url.searchParams.get("item");
    if (itemId) {
      const resolved = await (async () => {
        if (view === "wishlist") {
          const item = await getWishlistItem(env.DB, itemId);
          return item
            ? {
                item,
                description: [item.brand, "Saved in the wishlist"].filter(Boolean).join(" · "),
              }
            : null;
        }

        const item = await getHaulItem(env.DB, itemId);
        return item
          ? {
              item,
              description:
                item.comment || [item.brand, "Saved in the haul"].filter(Boolean).join(" · "),
            }
          : null;
      })();
      if (resolved) {
        const { item, description } = resolved;
        return {
          title: `${item.name} — ${SITE_NAME}`,
          description: description.slice(0, 160),
          canonical: absoluteUrl(
            url.origin,
            `/collection?view=${view}&item=${encodeURIComponent(item.id)}`,
          ),
          image: item.imageUrl
            ? absoluteUrl(url.origin, item.imageUrl)
            : ogImageUrl(url.origin, PUBLIC_PAGE_META[view].image),
          type: "article",
        };
      }
    }
    return staticPageMeta(url.origin, view);
  }

  return {
    ...staticPageMeta(url.origin, "gallery"),
    canonical: absoluteUrl(url.origin, path),
  };
}

app.get("/api/health", (c) =>
  c.json({
    ok: true,
    service: "my-moment",
    runtime: "cloudflare-worker",
  }),
);

app.get("/api/messages", async (c) => {
  const query = messageListQuerySchema.safeParse(c.req.query());
  if (!query.success) return c.json({ error: query.error.issues[0]?.message }, 400);
  const session = getSession();
  const result = await listMessages(
    c.env.DB,
    session?.user?.id ?? null,
    session?.user?.email ?? null,
    c.env.ALLOWED_EMAIL,
    query.data.cursor ?? null,
    query.data.limit,
  );
  return c.json(result);
});

app.post("/api/messages", async (c) => {
  const session = getSession();
  if (!session?.user) return c.json({ ok: false, error: "Sign in to leave a message" }, 401);
  const parsed = messageCreateSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid message" }, 400);
  }

  const result = await createMessage(
    c.env.DB,
    session.user.id,
    session.user.email,
    parsed.data.parentId ?? null,
    parsed.data.content,
    c.env.ALLOWED_EMAIL,
  );
  if (!result.ok) {
    if (result.reason === "rate_limited") {
      c.header("Retry-After", String(result.retryAfter));
      return c.json(
        { ok: false, error: `Please wait ${result.retryAfter}s before posting again` },
        429,
      );
    }
    return c.json({ ok: false, error: "Replies must target a top-level message" }, 400);
  }
  return c.json({ ok: true, message: result.message }, 201);
});

app.patch("/api/messages/:id", async (c) => {
  const session = getSession();
  if (!session?.user) return c.json({ ok: false, error: "Sign in to edit a message" }, 401);
  const parsed = messageUpdateSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid message" }, 400);
  }

  const owner = await getMessageOwner(c.env.DB, c.req.param("id"));
  if (!owner) return c.json({ ok: false, error: "Message not found" }, 404);
  if (owner.authorId !== session.user.id) {
    return c.json({ ok: false, error: "You can only edit your own messages" }, 403);
  }

  const message = await updateMessage(
    c.env.DB,
    c.req.param("id"),
    session.user.id,
    session.user.email,
    parsed.data.content,
    c.env.ALLOWED_EMAIL,
  );
  if (!message) return c.json({ ok: false, error: "Message not found" }, 404);
  return c.json({ ok: true, message });
});

app.delete("/api/messages/:id", async (c) => {
  const session = getSession();
  if (!session?.user) return c.json({ error: "Unauthorized" }, 401);
  const owner = await getMessageOwner(c.env.DB, c.req.param("id"));
  if (!owner) return c.json({ error: "Message not found" }, 404);
  const isHost = Boolean(c.env.ALLOWED_EMAIL && session.user.email === c.env.ALLOWED_EMAIL);
  if (owner.authorId !== session.user.id && !isHost) return c.json({ error: "Forbidden" }, 403);
  await deleteMessage(c.env.DB, c.req.param("id"));
  return c.json({ ok: true, deletedReplies: owner.isTopLevel });
});

app.get("/api/gallery", async (c) => {
  const canUpload = await requestIsOwner(c);
  const photos = await listPhotos(c.env.DB);

  return c.json({ photos, canUpload });
});

app.post("/api/photos/upload", uploadOwnerOnly, async (c) => {
  const result = await createPhotoFromUpload(
    c.env.DB,
    c.env.MOMENT_BUCKET,
    c.get("ownerId"),
    await c.req.formData(),
  );
  if (!result.ok) return c.json({ error: result.error }, 400);
  return c.json(result.photo);
});

app.get("/api/photos/:id", async (c) => {
  const id = c.req.param("id");
  const photo = await getPhoto(c.env.DB, id);
  if (!photo) return c.json({ error: "Photo not found" }, 404);
  return c.json(photo);
});

app.put("/api/photos/:id", ownerOnly, async (c) => {
  const parsed = photoUpdateSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0]?.message }, 400);
  }

  const id = c.req.param("id");
  const photo = await updatePhoto(c.env.DB, id, parsed.data);
  if (!photo) return c.json({ error: "Photo not found" }, 404);
  return c.json(photo);
});

app.delete("/api/photos/:id", ownerOnly, async (c) => {
  const id = c.req.param("id");
  const deleted = await deletePhoto(c.env.DB, c.env.MOMENT_BUCKET, id);
  if (!deleted) return c.json({ error: "Photo not found" }, 404);
  return c.json({ ok: true });
});

app.patch("/api/photos/:id/tags", ownerOnly, async (c) => {
  const parsed = photoUpdateSchema
    .pick({ tags: true })
    .safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0]?.message }, 400);
  }

  const id = c.req.param("id");
  const photo = await updatePhoto(c.env.DB, id, { tags: parsed.data.tags });

  if (!photo) return c.json({ error: "Photo not found" }, 404);
  return c.json(photo);
});

app.get("/api/og/:section", async (c) => {
  const section = c.req.param("section");
  const preview = c.req.query("preview") === "1";
  const domain = new URL(c.req.url).hostname;
  const count = (n: number, noun: string) => `${n} ${noun}${n === 1 ? "" : "s"}`;

  let options: OgImageOptions;
  let total: number;
  if (section === "gallery") {
    const photos = await listPhotos(c.env.DB);
    total = photos.length;
    options = {
      title: "Gallery",
      subtitle: count(total, "moment"),
      domain,
      siteName: "My Moment",
      type: "photo",
    };
  } else if (section === "haul") {
    const items = await listAllHaulItems(c.env.DB);
    total = items.length;
    options = {
      title: "Haul",
      subtitle: count(total, "item"),
      domain,
      siteName: "My Moment",
      type: "haul",
    };
  } else if (section === "wishlist") {
    const items = await listAllWishlistItems(c.env.DB);
    total = items.length;
    options = {
      title: "Wishlist",
      subtitle: count(total, "item"),
      domain,
      siteName: "My Moment",
      type: "wish",
    };
  } else if (section === "collection") {
    const [haul, wishes] = await Promise.all([
      listAllHaulItems(c.env.DB),
      listAllWishlistItems(c.env.DB),
    ]);
    total = haul.length + wishes.length;
    options = {
      title: "Collection",
      subtitle: `${haul.length} collected · ${wishes.length} wished`,
      domain,
      siteName: "My Moment",
      type: "haul",
    };
  } else if (section === "journey") {
    total = 0;
    options = {
      title: "Journey",
      subtitle: "Places that became part of the story",
      domain,
      siteName: SITE_NAME,
      type: "journey",
    };
  } else if (section === "guestbook") {
    total = 0;
    options = {
      title: "Guestbook",
      subtitle: "Notes left along the way",
      domain,
      siteName: SITE_NAME,
      type: "guestbook",
    };
  } else {
    return c.notFound();
  }

  const pngHeaders = {
    "Content-Type": "image/png",
    "Cache-Control": preview
      ? "no-store, no-cache, must-revalidate"
      : "public, max-age=86400, s-maxage=86400",
  };

  const imageVersion = getOgImageVersion();
  if (!preview) {
    const cached = await readOgImageKv(c.env.MOMENT_CACHE, section, total, imageVersion);
    if (cached) {
      return new Response(cached, { headers: pngHeaders });
    }
  }

  const logoResponse = await c.env.ASSETS.fetch(new Request(new URL("/favicon.png", c.req.url)));
  const logoDataUrl = logoResponse.ok
    ? `data:${logoResponse.headers.get("Content-Type") || "image/png"};base64,${arrayBufferToBase64(await logoResponse.arrayBuffer())}`
    : undefined;
  const svg = renderOgImage({ ...options, logoDataUrl });
  const png = await renderOgPng(svg, c.env.MOMENT_CACHE);
  if (!preview) {
    await writeOgImageKv(c.env.MOMENT_CACHE, section, total, imageVersion, png);
  }
  return new Response(png, { headers: pngHeaders });
});

app.get("/api/photos/*", async (c) => {
  const filename = c.req.path.replace(/^\/api\/photos\//, "");
  if (!filename) return c.notFound();

  const key =
    filename.startsWith("img/thumbnails/") || filename.startsWith("img/")
      ? filename
      : `img/${filename}`;
  const obj = await c.env.MOMENT_BUCKET.get(key);
  if (!obj) return c.notFound();

  const mimeMap: Record<string, string> = {
    webp: "image/webp",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    avif: "image/avif",
  };
  const parts = filename.split(".");
  const ext = parts.length > 1 ? parts.pop()!.toLowerCase() : "bin";
  const mime = mimeMap[ext] ?? "application/octet-stream";

  if (!obj.body) return c.notFound();
  return new Response(obj.body, {
    headers: {
      "content-type": mime,
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
});

app.get("/api/tags", async (c) => {
  const allTags = await getAllTags(c.env.DB);
  return c.json({ tags: allTags });
});

app.put("/api/tags/:name", ownerOnly, async (c) => {
  const oldName = decodeURIComponent(c.req.param("name"));
  const parsed = z
    .object({ name: z.string().trim().min(1, "name is required") })
    .safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0]?.message }, 400);
  }

  const ok = await renameTag(c.env.DB, oldName, parsed.data.name);
  if (!ok) return c.json({ error: "Tag not found or name already exists" }, 404);
  return c.json({ ok: true });
});

app.delete("/api/tags/:name", ownerOnly, async (c) => {
  const name = decodeURIComponent(c.req.param("name"));
  const ok = await deleteTag(c.env.DB, name);
  if (!ok) return c.json({ error: "Tag not found" }, 404);
  return c.json({ ok: true });
});

app.post("/api/migrate", async (c) => {
  const force = c.req.query("force") === "true";
  const existing = await readManifest(c.env.MOMENT_CACHE);
  if (existing.length > 0 && !force) {
    return c.json({
      migrated: false,
      count: existing.length,
      message: "KV already has data. Pass ?force=true to overwrite.",
    });
  }
  if (force) {
    await deleteManifest(c.env.MOMENT_CACHE);
  }

  const obj = await c.env.MOMENT_BUCKET.get("manifest.json");
  if (!obj) {
    return c.json({
      migrated: false,
      count: 0,
      message: "No manifest.json in R2",
    });
  }

  const data = await obj.json();
  const photos = Array.isArray(data) ? data : [];

  if (photos.length > 0) {
    await writeManifest(c.env.MOMENT_CACHE, photos as PhotoManifest[]);
  }

  return c.json({ migrated: true, count: photos.length });
});

app.get("/api/debug/photos", async (c) => {
  const photos = await listPhotos(c.env.DB);
  return c.json(photos);
});

app.get("/api/haul", async (c) => {
  const items = await listAllHaulItems(c.env.DB);
  const canManage = await requestIsOwner(c);

  return c.json({ items, canManage });
});

app.get("/api/haul/:id", async (c) => {
  const id = c.req.param("id");
  const item = await getHaulItem(c.env.DB, id);
  if (!item) return c.json({ error: "Not found" }, 404);
  return c.json(item);
});

app.post("/api/haul", ownerOnly, async (c) => {
  const parsed = goodsFormSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: parsed.error.issues[0]?.message }, 400);

  const item = await createHaulItem(c.env.DB, c.get("ownerId"), parsed.data);
  return c.json(item, 201);
});

app.post("/api/haul/upload", ownerOnly, async (c) => {
  const form = await c.req.formData();
  const result = await uploadHaulImage(c.env.MOMENT_BUCKET, form.get("file"));
  if (!result.ok) return c.json({ error: result.error }, 400);
  return c.json({ key: result.key, url: result.url });
});

app.put("/api/haul/:id", ownerOnly, async (c) => {
  const parsed = goodsFormSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: parsed.error.issues[0]?.message }, 400);

  const id = c.req.param("id");
  const item = await updateHaulItem(c.env.DB, c.get("ownerId"), id, parsed.data);
  if (!item) return c.json({ error: "Not found" }, 404);
  return c.json(item);
});

app.delete("/api/haul/:id", ownerOnly, async (c) => {
  const id = c.req.param("id");
  const deleted = await deleteHaulItem(c.env.DB, c.env.MOMENT_BUCKET, c.get("ownerId"), id);
  if (!deleted) return c.json({ error: "Not found" }, 404);
  return c.json({ ok: true });
});

app.get("/api/wish", async (c) => {
  const items = await listAllWishlistItems(c.env.DB);
  const canManage = await requestIsOwner(c);

  return c.json({ items, canManage });
});

app.get("/api/wish/:id", async (c) => {
  const id = c.req.param("id");
  const item = await getWishlistItem(c.env.DB, id);
  if (!item) return c.json({ error: "Not found" }, 404);
  return c.json(item);
});

app.post("/api/wish/upload", ownerOnly, async (c) => {
  const form = await c.req.formData();
  const result = await uploadWishlistImage(c.env.MOMENT_BUCKET, form.get("file"));
  if (!result.ok) return c.json({ error: result.error }, 400);
  return c.json({ key: result.key, url: result.url });
});

app.post("/api/wish", ownerOnly, async (c) => {
  const parsed = wishFormSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: parsed.error.issues[0]?.message }, 400);

  const item = await createWishlistItem(c.env.DB, c.get("ownerId"), parsed.data);
  return c.json(item, 201);
});

app.put("/api/wish/:id", ownerOnly, async (c) => {
  const parsed = wishFormSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: parsed.error.issues[0]?.message }, 400);

  const id = c.req.param("id");
  const item = await updateWishlistItem(c.env.DB, c.get("ownerId"), id, parsed.data);
  if (!item) return c.json({ error: "Not found" }, 404);
  return c.json(item);
});

app.delete("/api/wish/:id", ownerOnly, async (c) => {
  const id = c.req.param("id");
  const deleted = await deleteWishlistItem(c.env.DB, c.env.MOMENT_BUCKET, c.get("ownerId"), id);
  if (!deleted) return c.json({ error: "Not found" }, 404);
  return c.json({ ok: true });
});

app.post("/api/wish/:id/convert", ownerOnly, async (c) => {
  const parsed = goodsFormSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: parsed.error.issues[0]?.message }, 400);
  const item = await convertWishlistItem(
    c.env.DB,
    c.get("ownerId"),
    c.req.param("id"),
    parsed.data,
  );
  if (!item) return c.json({ error: "Wish not found" }, 404);
  return c.json(item, 201);
});

app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

function escAttr(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildHeadMeta(tags: Record<string, string>): string {
  return Object.entries(tags)
    .map(([k, v]) => {
      if (k === "canonical") {
        return `<link rel="canonical" href="${escAttr(v)}" data-static-head />`;
      }
      if (k.startsWith("og:")) {
        return `<meta property="${k}" content="${escAttr(v)}" data-static-head />`;
      }
      return `<meta name="${k}" content="${escAttr(v)}" data-static-head />`;
    })
    .join("\n    ");
}

app.get("*", async (c) => {
  if (!c.env.ASSETS) return c.notFound();

  const url = new URL(c.req.url);
  if (
    url.pathname.startsWith("/@") ||
    url.pathname.startsWith("/assets/") ||
    /\.[a-zA-Z0-9]+$/.test(url.pathname)
  ) {
    return c.env.ASSETS.fetch(c.req.raw);
  }

  const indexUrl = new URL("/", url);
  const htmlRes = await c.env.ASSETS.fetch(
    new Request(indexUrl.toString(), {
      headers: c.req.raw.headers,
      method: "GET",
    }),
  );

  const page = await resolvePageMeta(url, c.env);
  const ogTags: Record<string, string> = {
    description: page.description,
    canonical: page.canonical,
    "og:site_name": SITE_NAME,
    "og:locale": "en_US",
    "og:title": page.title,
    "og:description": page.description,
    "og:url": page.canonical,
    "og:type": page.type ?? "website",
    "twitter:card": "summary_large_image",
    "twitter:title": page.title,
    "twitter:description": page.description,
  };
  if (page.image) {
    ogTags["og:image"] = page.image;
    ogTags["og:image:secure_url"] = page.image;
    ogTags["og:image:type"] = "image/png";
    ogTags["og:image:alt"] = page.title;
    ogTags["twitter:image"] = page.image;
    ogTags["twitter:image:alt"] = page.title;
  }
  if (page.imageWidth) ogTags["og:image:width"] = String(page.imageWidth);
  if (page.imageHeight) ogTags["og:image:height"] = String(page.imageHeight);
  if (page.robots) ogTags.robots = page.robots;

  const injected = buildHeadMeta(ogTags);
  return new HTMLRewriter()
    .on("title", {
      element(element) {
        element.setInnerContent(page.title);
        element.setAttribute("data-static-head", "");
      },
    })
    .on("head", {
      element(el) {
        el.append(injected, { html: true });
      },
    })
    .transform(htmlRes);
});

export default app;
