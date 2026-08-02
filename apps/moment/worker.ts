import { Hono } from "hono";
import { z } from "zod";
import { getAuth } from "~/lib/auth";
import {
  createOwnerGuard,
  getRequestSession,
  requestIsOwner,
  type WorkerEnv,
} from "~/lib/server/access";
import { uploadCollectionImage } from "~/lib/server/collection-image";
import { readManifest, writeManifest, deleteManifest, type PhotoManifest } from "~/lib/kv";
import {
  listPhotos,
  getPhoto,
  createPhoto,
  updatePhoto,
  deletePhoto,
  getAllTags,
  renameTag,
  deleteTag,
} from "~/lib/server/photos/repository";
import {
  getHaulItem,
  listAllHaulItems,
  createHaulItem,
  updateHaulItem,
  deleteHaulItem,
} from "~/lib/server/haul/repository";
import {
  getWishlistItem,
  listAllWishlistItems,
  createWishlistItem,
  updateWishlistItem,
  deleteWishlistItem,
  convertWishlistItem,
} from "~/lib/server/wishlist/repository";
import { goodsFormSchema, wishFormSchema } from "~/types/haul";
import { photoUploadSchema, photoUpdateSchema } from "~/types/photo";
import { renderOgImage, renderOgPng } from "~/lib/server/og";
import { readOgImageKv, writeOgImageKv } from "~/lib/server/og/cache";
import {
  createMessage,
  deleteMessage,
  getMessageOwner,
  listMessages,
} from "~/lib/server/messages/repository";
import type { MessageCursor, OgSection } from "~/types";
import { HOST_DISPLAY_NAME } from "~/lib/identity";

const app = new Hono<WorkerEnv>();
const ownerOnly = createOwnerGuard();
const uploadOwnerOnly = createOwnerGuard("Upload not configured");

const messageCreateSchema = z.object({
  content: z.string().trim().min(1).max(1000),
  parentId: z.string().uuid().optional(),
});

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

function sectionForPath(url: URL): OgSection | null {
  const path = url.pathname;
  if (path === "/" || path.startsWith("/photos/")) {
    return {
      key: "gallery",
      title: "Gallery",
      description: "A personal photo gallery and collection journal.",
    };
  }
  if (path === "/haul" || path === "/haul/") {
    return { key: "haul", title: "Haul", description: "Things I bought and what I think of them." };
  }
  if (path === "/wish" || path === "/wish/") {
    return { key: "wishlist", title: "Wishlist", description: "Things I'm hoping to get." };
  }
  if (path === "/collection" || path === "/collection/") {
    return {
      key: "collection",
      title: "Collection",
      description: "Things collected, considered, and remembered.",
    };
  }
  return null;
}

app.all("/api/auth/*", async (c) => {
  const auth = getAuth(c.env);
  const response = await auth.handler(c.req.raw);
  if (c.req.path !== "/api/auth/get-session" || !response.ok || !c.env.ALLOWED_EMAIL) {
    return response;
  }

  const payload = (await response
    .clone()
    .json()
    .catch(() => null)) as { user?: { email?: string; name?: string } } | null;
  if (payload?.user?.email !== c.env.ALLOWED_EMAIL) return response;

  payload.user.name = HOST_DISPLAY_NAME;
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  return new Response(JSON.stringify(payload), {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
});

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
  const session = await getRequestSession(c);
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
  const session = await getRequestSession(c);
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

app.delete("/api/messages/:id", async (c) => {
  const session = await getRequestSession(c);
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
  const form = await c.req.formData();
  const file = form.get("file");
  const thumbnail = form.get("thumbnail");
  if (!(file instanceof File)) return c.json({ error: "No file provided" }, 400);

  let maxNum = 0;
  let cursor: string | undefined;
  do {
    const listed = await c.env.MOMENT_BUCKET.list({
      prefix: "img/image",
      cursor,
    });
    for (const obj of listed.objects) {
      const match = obj.key.match(/^img\/image(\d+)\./);
      if (match) maxNum = Math.max(maxNum, Number(match[1]));
    }
    cursor = listed.truncated ? listed.cursor : undefined;
  } while (cursor);

  const num = maxNum + 1;
  const imageKey = `img/image${num}.png`;
  const thumbKey = `img/thumbnails/image${num}.jpg`;

  const [imageBuffer, thumbBuffer] = await Promise.all([
    file.arrayBuffer(),
    thumbnail instanceof File ? thumbnail.arrayBuffer() : file.arrayBuffer(),
  ]);

  await Promise.all([
    c.env.MOMENT_BUCKET.put(imageKey, imageBuffer, {
      httpMetadata: { contentType: "image/png" },
    }),
    c.env.MOMENT_BUCKET.put(thumbKey, thumbBuffer, {
      httpMetadata: { contentType: "image/jpeg" },
    }),
  ]);

  const str = (key: string) => {
    const v = form.get(key);
    return typeof v === "string" ? v : undefined;
  };

  const parsed = photoUploadSchema.safeParse({
    title: str("title"),
    description: str("description"),
    date: str("date"),
    geo: str("geo") ? JSON.parse(str("geo")!) : undefined,
    tags: str("tags") ? JSON.parse(str("tags")!) : [],
    thumbHash: str("thumbHash"),
    width: str("width"),
    height: str("height"),
    aspectRatio: str("aspectRatio"),
  });
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0]?.message }, 400);
  }
  const input = parsed.data;

  const photo = await createPhoto(c.env.DB, c.get("ownerId"), {
    url: `/api/photos/image${num}.png`,
    thumbnailUrl: `/api/photos/${thumbKey}`,
    thumbHash: input.thumbHash,
    title: input.title || file.name,
    width: input.width,
    height: input.height,
    aspectRatio: input.aspectRatio,
    size: file.size,
    format: file.name.split(".").pop()?.toUpperCase() || "PNG",
    date: input.date || new Date().toISOString(),
    description: input.description || "",
    geo: input.geo,
    tags: input.tags,
  });

  return c.json(photo);
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
  const deleted = await deletePhoto(c.env.DB, id);
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
  const domain = new URL(c.req.url).hostname;
  const count = (n: number, noun: string) => `${n} ${noun}${n === 1 ? "" : "s"}`;

  let svg: string;
  let total: number;
  if (section === "gallery") {
    const photos = await listPhotos(c.env.DB);
    total = photos.length;
    svg = renderOgImage({
      title: "Gallery",
      subtitle: count(total, "moment"),
      domain,
      siteName: "My Moment",
      type: "photo",
    });
  } else if (section === "haul") {
    const items = await listAllHaulItems(c.env.DB);
    total = items.length;
    svg = renderOgImage({
      title: "Haul",
      subtitle: count(total, "item"),
      domain,
      siteName: "My Moment",
      type: "haul",
    });
  } else if (section === "wishlist") {
    const items = await listAllWishlistItems(c.env.DB);
    total = items.length;
    svg = renderOgImage({
      title: "Wishlist",
      subtitle: count(total, "item"),
      domain,
      siteName: "My Moment",
      type: "wish",
    });
  } else if (section === "collection") {
    const [haul, wishes] = await Promise.all([
      listAllHaulItems(c.env.DB),
      listAllWishlistItems(c.env.DB),
    ]);
    total = haul.length + wishes.length;
    svg = renderOgImage({
      title: "Collection",
      subtitle: `${haul.length} collected · ${wishes.length} wished`,
      domain,
      siteName: "My Moment",
      type: "haul",
    });
  } else {
    return c.notFound();
  }

  const pngHeaders = {
    "Content-Type": "image/png",
    "Cache-Control": "public, max-age=86400, s-maxage=86400",
  };

  const cached = await readOgImageKv(c.env.MOMENT_CACHE, section, total);
  if (cached) {
    return new Response(cached, { headers: pngHeaders });
  }

  const png = await renderOgPng(svg, c.env.MOMENT_CACHE);
  await writeOgImageKv(c.env.MOMENT_CACHE, section, total, png);
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
  const result = await uploadCollectionImage(c.env.MOMENT_BUCKET, "haul", form.get("file"));
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
  const deleted = await deleteHaulItem(c.env.DB, c.get("ownerId"), id);
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
  const result = await uploadCollectionImage(c.env.MOMENT_BUCKET, "wishlist", form.get("file"));
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
  const deleted = await deleteWishlistItem(c.env.DB, c.get("ownerId"), id);
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

function buildOgMeta(tags: Record<string, string>): string {
  return Object.entries(tags)
    .map(([k, v]) => {
      if (k === "title") return `<title>${escAttr(v)}</title>`;
      if (k.startsWith("og:")) return `<meta property="${k}" content="${escAttr(v)}" />`;
      return `<meta name="${k}" content="${escAttr(v)}" />`;
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

  const section = sectionForPath(url);
  if (!section) {
    return htmlRes;
  }

  const ogImage = `${url.origin}/api/og/${section.key}`;
  const ogTitle = `${section.title} — My Moment`;
  const ogTags: Record<string, string> = {
    title: ogTitle,
    "og:site_name": "My Moment",
    "og:title": ogTitle,
    "og:description": section.description,
    "og:image": ogImage,
    "og:image:width": "1200",
    "og:image:height": "630",
    "og:url": url.href,
    "og:type": "website",
    "twitter:card": "summary_large_image",
    "twitter:title": ogTitle,
    "twitter:description": section.description,
    "twitter:image": ogImage,
  };

  const injected = buildOgMeta(ogTags);
  return new HTMLRewriter()
    .on("head", {
      element(el) {
        el.append(injected, { html: true });
      },
    })
    .transform(htmlRes);
});

export default app;
