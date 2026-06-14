import { Hono } from "hono";
import type { D1Database, R2Bucket, KVNamespace } from "@cloudflare/workers-types";
import { getAuth } from "~/lib/auth";
import {
  readManifest,
  writeManifest,
  deleteManifest,
  appendPhoto,
  type PhotoManifest,
} from "~/lib/kv";
import {
  listPhotos,
  getPhoto,
  createPhoto,
  updatePhoto,
  deletePhoto,
  getAllTags,
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
    const listed = await c.env.MOMENT_BUCKET.list({ prefix: "img/image", cursor });
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

  const exifDate = str("exifDate");
  const exifGeo = str("exifGeo");
  const tagsRaw = str("tags");
  let parsedTags: string[] = [];
  if (tagsRaw) {
    try {
      const parsed = JSON.parse(tagsRaw);
      if (Array.isArray(parsed)) {
        parsedTags = parsed.filter((t): t is string => typeof t === "string").map((t) => t.trim().toLowerCase()).filter(Boolean);
      }
    } catch {}
  }

  const photo = await createPhoto(c.env.DB, session.user.id, {
    url: `/api/photos/image${num}.png`,
    thumbnailUrl: `/api/photos/${thumbKey}`,
    thumbHash: str("thumbHash"),
    title: file.name,
    width: Number(form.get("width")) || 0,
    height: Number(form.get("height")) || 0,
    aspectRatio: Number(form.get("aspectRatio")) || undefined,
    size: file.size,
    format: file.name.split(".").pop()?.toUpperCase() || "PNG",
    date: exifDate ?? new Date().toISOString(),
    description: "",
    geo: exifGeo ? JSON.parse(exifGeo) : undefined,
    tags: parsedTags,
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

  let body: { title?: string; description?: string; tags?: string[] };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }

  const id = c.req.param("id");
  const photo = await updatePhoto(c.env.DB, id, body);
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

  let body: { tags?: unknown };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }

  if (!Array.isArray(body.tags)) {
    return c.json({ error: "tags must be an array" }, 400);
  }

  const id = c.req.param("id");
  const photo = await updatePhoto(c.env.DB, id, {
    tags: body.tags.filter((t): t is string => typeof t === "string"),
  });

  if (!photo) return c.json({ error: "Photo not found" }, 404);
  return c.json(photo);
});

app.get("/api/tags", async (c) => {
  const allTags = await getAllTags(c.env.DB);
  return c.json({ tags: allTags });
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
    return c.json({ migrated: false, count: 0, message: "No manifest.json in R2" });
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
    const listed = await c.env.MOMENT_BUCKET.list({ prefix: "img/haul/image", cursor });
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

app.get("*", async (c) => {
  if (!c.env.ASSETS) return c.notFound();

  const url = new URL(c.req.url);
  if (url.pathname.startsWith("/assets/") || /\.[a-zA-Z0-9]+$/.test(url.pathname)) {
    return c.env.ASSETS.fetch(c.req.raw);
  }

  const indexUrl = new URL("/", url);
  return c.env.ASSETS.fetch(
    new Request(indexUrl.toString(), {
      headers: c.req.raw.headers,
      method: "GET",
    }),
  );
});

export default app;
