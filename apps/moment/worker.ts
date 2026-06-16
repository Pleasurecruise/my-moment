import { Hono } from "hono";
import { z } from "zod";
import type { D1Database, R2Bucket, KVNamespace } from "@cloudflare/workers-types";
import { getAuth } from "~/lib/auth";
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
} from "~/lib/server/wishlist/repository";
import { goodsFormSchema, wishFormSchema } from "~/modules/haul/types";
import { photoUploadSchema, photoUpdateSchema } from "~/types/photo";
import { renderOgImage, renderOgPng } from "~/lib/server/og";
import { readOgImageKv, writeOgImageKv } from "~/lib/server/og/cache";

type Bindings = {
  DB: D1Database;
  MOMENT_BUCKET: R2Bucket;
  MOMENT_CACHE: KVNamespace;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  ALLOWED_EMAIL?: string;
  CF_ACCOUNT_ID: string;
  CF_GATEWAY_NAME: string;
  AI_GATEWAY_PROVIDER_SLUG: string;
  OPENAI_API_KEY?: string;
  CF_AIG_TOKEN?: string;
  TAVILY_API_KEY?: string;
  ASSETS: Fetcher;
};

const app = new Hono<{ Bindings: Bindings }>();

type OgSection = { key: "gallery" | "haul" | "wishlist"; title: string; description: string };

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
  return null;
}

app.all("/api/auth/*", async (c) => {
  const auth = getAuth(c.env);
  return auth.handler(c.req.raw);
});

app.get("/api/health", (c) =>
  c.json({
    ok: true,
    service: "my-moment",
    runtime: "cloudflare-worker",
  }),
);

app.get("/api/gallery", async (c) => {
  let canUpload = false;
  const allowed = c.env.ALLOWED_EMAIL;
  if (allowed) {
    const auth = getAuth(c.env);
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    canUpload = session?.user?.email === allowed;
  }

  const photos = await listPhotos(c.env.DB);

  return c.json({ photos, canUpload });
});

app.post("/api/photos/upload", async (c) => {
  const allowed = c.env.ALLOWED_EMAIL;
  if (!allowed) return c.json({ error: "Upload not configured" }, 500);

  const auth = getAuth(c.env);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user?.email) return c.json({ error: "Unauthorized" }, 401);
  if (session.user.email !== allowed) return c.json({ error: "Forbidden" }, 403);

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

  const photo = await createPhoto(c.env.DB, session.user.id, {
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

app.put("/api/photos/:id", async (c) => {
  const allowed = c.env.ALLOWED_EMAIL;
  if (!allowed) return c.json({ error: "Not configured" }, 500);

  const auth = getAuth(c.env);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user?.email) return c.json({ error: "Unauthorized" }, 401);
  if (session.user.email !== allowed) return c.json({ error: "Forbidden" }, 403);

  const parsed = photoUpdateSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0]?.message }, 400);
  }

  const id = c.req.param("id");
  const photo = await updatePhoto(c.env.DB, id, parsed.data);
  if (!photo) return c.json({ error: "Photo not found" }, 404);
  return c.json(photo);
});

app.delete("/api/photos/:id", async (c) => {
  const allowed = c.env.ALLOWED_EMAIL;
  if (!allowed) return c.json({ error: "Not configured" }, 500);

  const auth = getAuth(c.env);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user?.email) return c.json({ error: "Unauthorized" }, 401);
  if (session.user.email !== allowed) return c.json({ error: "Forbidden" }, 403);

  const id = c.req.param("id");
  const deleted = await deletePhoto(c.env.DB, id);
  if (!deleted) return c.json({ error: "Photo not found" }, 404);
  return c.json({ ok: true });
});

app.patch("/api/photos/:id/tags", async (c) => {
  const allowed = c.env.ALLOWED_EMAIL;
  if (!allowed) return c.json({ error: "Not configured" }, 500);

  const auth = getAuth(c.env);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user?.email) return c.json({ error: "Unauthorized" }, 401);
  if (session.user.email !== allowed) return c.json({ error: "Forbidden" }, 403);

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
  // @ts-expect-error
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

app.put("/api/tags/:name", async (c) => {
  const allowed = c.env.ALLOWED_EMAIL;
  if (!allowed) return c.json({ error: "Not configured" }, 500);

  const auth = getAuth(c.env);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user?.email) return c.json({ error: "Unauthorized" }, 401);
  if (session.user.email !== allowed) return c.json({ error: "Forbidden" }, 403);

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

app.delete("/api/tags/:name", async (c) => {
  const allowed = c.env.ALLOWED_EMAIL;
  if (!allowed) return c.json({ error: "Not configured" }, 500);

  const auth = getAuth(c.env);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user?.email) return c.json({ error: "Unauthorized" }, 401);
  if (session.user.email !== allowed) return c.json({ error: "Forbidden" }, 403);

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

  let canManage = false;
  const allowed = c.env.ALLOWED_EMAIL;
  if (allowed) {
    const auth = getAuth(c.env);
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    canManage = session?.user?.email === allowed;
  }

  return c.json({ items, canManage });
});

app.get("/api/haul/:id", async (c) => {
  const id = c.req.param("id");
  const item = await getHaulItem(c.env.DB, id);
  if (!item) return c.json({ error: "Not found" }, 404);
  return c.json(item);
});

app.post("/api/haul", async (c) => {
  const allowed = c.env.ALLOWED_EMAIL;
  if (!allowed) return c.json({ error: "Not configured" }, 500);

  const auth = getAuth(c.env);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user?.email) return c.json({ error: "Unauthorized" }, 401);
  if (session.user.email !== allowed) return c.json({ error: "Forbidden" }, 403);

  const parsed = goodsFormSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: parsed.error.issues[0]?.message }, 400);

  const item = await createHaulItem(c.env.DB, session.user.id, parsed.data);
  return c.json(item, 201);
});

app.post("/api/haul/upload", async (c) => {
  const allowed = c.env.ALLOWED_EMAIL;
  if (!allowed) return c.json({ error: "Not configured" }, 500);

  const auth = getAuth(c.env);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user?.email) return c.json({ error: "Unauthorized" }, 401);
  if (session.user.email !== allowed) return c.json({ error: "Forbidden" }, 403);

  const form = await c.req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return c.json({ error: "No file provided" }, 400);

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
  if (!allowedTypes.includes(file.type)) {
    return c.json({ error: "Invalid file type. Allowed: JPG, PNG, WebP, GIF, AVIF" }, 400);
  }

  let maxNum = 0;
  let cursor: string | undefined;
  do {
    const listed = await c.env.MOMENT_BUCKET.list({
      prefix: "img/haul/image",
      cursor,
    });
    for (const obj of listed.objects) {
      const match = obj.key.match(/^img\/haul\/image(\d+)\./);
      if (match) maxNum = Math.max(maxNum, Number(match[1]));
    }
    cursor = listed.truncated ? listed.cursor : undefined;
  } while (cursor);

  const num = maxNum + 1;
  const extMap: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/avif": "avif",
  };
  const ext = extMap[file.type] ?? "png";
  const imageKey = `img/haul/image${String(num).padStart(2, "0")}.${ext}`;

  await c.env.MOMENT_BUCKET.put(imageKey, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
  });

  return c.json({
    key: imageKey,
    url: `/api/photos/haul/image${String(num).padStart(2, "0")}.${ext}`,
  });
});

app.put("/api/haul/:id", async (c) => {
  const allowed = c.env.ALLOWED_EMAIL;
  if (!allowed) return c.json({ error: "Not configured" }, 500);

  const auth = getAuth(c.env);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user?.email) return c.json({ error: "Unauthorized" }, 401);
  if (session.user.email !== allowed) return c.json({ error: "Forbidden" }, 403);

  const parsed = goodsFormSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: parsed.error.issues[0]?.message }, 400);

  const id = c.req.param("id");
  const item = await updateHaulItem(c.env.DB, session.user.id, id, parsed.data);
  if (!item) return c.json({ error: "Not found" }, 404);
  return c.json(item);
});

app.delete("/api/haul/:id", async (c) => {
  const allowed = c.env.ALLOWED_EMAIL;
  if (!allowed) return c.json({ error: "Not configured" }, 500);

  const auth = getAuth(c.env);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user?.email) return c.json({ error: "Unauthorized" }, 401);
  if (session.user.email !== allowed) return c.json({ error: "Forbidden" }, 403);

  const id = c.req.param("id");
  const deleted = await deleteHaulItem(c.env.DB, session.user.id, id);
  if (!deleted) return c.json({ error: "Not found" }, 404);
  return c.json({ ok: true });
});

app.get("/api/wish", async (c) => {
  const items = await listAllWishlistItems(c.env.DB);

  let canManage = false;
  const allowed = c.env.ALLOWED_EMAIL;
  if (allowed) {
    const auth = getAuth(c.env);
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    canManage = session?.user?.email === allowed;
  }

  return c.json({ items, canManage });
});

app.get("/api/wish/:id", async (c) => {
  const id = c.req.param("id");
  const item = await getWishlistItem(c.env.DB, id);
  if (!item) return c.json({ error: "Not found" }, 404);
  return c.json(item);
});

app.post("/api/wish/upload", async (c) => {
  const allowed = c.env.ALLOWED_EMAIL;
  if (!allowed) return c.json({ error: "Not configured" }, 500);

  const auth = getAuth(c.env);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user?.email) return c.json({ error: "Unauthorized" }, 401);
  if (session.user.email !== allowed) return c.json({ error: "Forbidden" }, 403);

  const form = await c.req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return c.json({ error: "No file provided" }, 400);

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
  if (!allowedTypes.includes(file.type)) {
    return c.json({ error: "Invalid file type. Allowed: JPG, PNG, WebP, GIF, AVIF" }, 400);
  }

  let maxNum = 0;
  let cursor: string | undefined;
  do {
    const listed = await c.env.MOMENT_BUCKET.list({
      prefix: "img/wishlist/image",
      cursor,
    });
    for (const obj of listed.objects) {
      const match = obj.key.match(/^img\/wishlist\/image(\d+)\./);
      if (match) maxNum = Math.max(maxNum, Number(match[1]));
    }
    cursor = listed.truncated ? listed.cursor : undefined;
  } while (cursor);

  const num = maxNum + 1;
  const extMap: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/avif": "avif",
  };
  const ext = extMap[file.type] ?? "png";
  const imageKey = `img/wishlist/image${String(num).padStart(2, "0")}.${ext}`;

  await c.env.MOMENT_BUCKET.put(imageKey, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
  });

  return c.json({
    key: imageKey,
    url: `/api/photos/wishlist/image${String(num).padStart(2, "0")}.${ext}`,
  });
});

app.post("/api/wish", async (c) => {
  const allowed = c.env.ALLOWED_EMAIL;
  if (!allowed) return c.json({ error: "Not configured" }, 500);

  const auth = getAuth(c.env);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user?.email) return c.json({ error: "Unauthorized" }, 401);
  if (session.user.email !== allowed) return c.json({ error: "Forbidden" }, 403);

  const parsed = wishFormSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: parsed.error.issues[0]?.message }, 400);

  const item = await createWishlistItem(c.env.DB, session.user.id, parsed.data);
  return c.json(item, 201);
});

app.put("/api/wish/:id", async (c) => {
  const allowed = c.env.ALLOWED_EMAIL;
  if (!allowed) return c.json({ error: "Not configured" }, 500);

  const auth = getAuth(c.env);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user?.email) return c.json({ error: "Unauthorized" }, 401);
  if (session.user.email !== allowed) return c.json({ error: "Forbidden" }, 403);

  const parsed = wishFormSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: parsed.error.issues[0]?.message }, 400);

  const id = c.req.param("id");
  const item = await updateWishlistItem(c.env.DB, session.user.id, id, parsed.data);
  if (!item) return c.json({ error: "Not found" }, 404);
  return c.json(item);
});

app.delete("/api/wish/:id", async (c) => {
  const allowed = c.env.ALLOWED_EMAIL;
  if (!allowed) return c.json({ error: "Not configured" }, 500);

  const auth = getAuth(c.env);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user?.email) return c.json({ error: "Unauthorized" }, 401);
  if (session.user.email !== allowed) return c.json({ error: "Forbidden" }, 403);

  const id = c.req.param("id");
  const deleted = await deleteWishlistItem(c.env.DB, session.user.id, id);
  if (!deleted) return c.json({ error: "Not found" }, 404);
  return c.json({ ok: true });
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
  if (url.pathname.startsWith("/assets/") || /\.[a-zA-Z0-9]+$/.test(url.pathname)) {
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

  const ogTags: Record<string, string> = {
    title: `${section.title} — My Moment`,
    "og:title": `${section.title} — My Moment`,
    "og:description": section.description,
    "og:image": `${url.origin}/api/og/${section.key}`,
    "og:url": url.href,
    "og:type": "website",
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
