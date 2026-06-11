import { Hono } from "hono";
import { getAuth } from "./src/lib/auth";
import { readManifest, writeManifest, appendPhoto, type PhotoManifest } from "./src/lib/kv";

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
  const photos = await readManifest(c.env.MOMENT_CACHE);

  let canUpload = false;
  const allowed = c.env.ALLOWED_EMAIL;
  if (allowed) {
    const auth = getAuth(c.env);
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    canUpload = session?.user?.email === allowed;
  }

  return c.json({ photos, canUpload });
});

app.get("/api/photos/*", async (c) => {
  const filename = c.req.path.replace(/^\/api\/photos\//, "");
  if (!filename) return c.notFound();

  const key = filename.startsWith("thumbnails/") ? filename : `img/${filename}`;
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
  const ext = filename.split(".").pop()!.toLowerCase();
  const mime = mimeMap[ext] ?? "application/octet-stream";

  return new Response(obj.body, {
    headers: {
      "content-type": mime,
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
});

app.get("/api/bootstrap", (c) => {
  const today = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(new Date());

  return c.json({
    today,
    quote: "Keep the detail. The mood can explain itself later.",
    metrics: [
      { label: "Saved", value: "12", tone: "notes this week" },
      { label: "Focus", value: "84%", tone: "signal over noise" },
      { label: "Media", value: "3", tone: "files waiting" },
    ],
    moments: [
      {
        id: "morning",
        time: "08:15",
        title: "Coffee before the meeting",
        note: "The plan got clearer after writing the risky part down first.",
        tag: "work",
      },
      {
        id: "walk",
        time: "13:40",
        title: "A short walk fixed the paragraph",
        note: "Not magic, just enough quiet to notice the obvious sentence.",
        tag: "thought",
      },
      {
        id: "evening",
        time: "20:05",
        title: "Save the receipt photo",
        note: "Attach to the trip note when R2 persistence lands.",
        tag: "todo",
      },
    ],
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
  const thumbKey = `thumbnails/image${num}.jpg`;

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

  const photo: PhotoManifest = {
    id: `image${num}`,
    url: `/api/photos/${imageKey}`,
    thumbnailUrl: `/api/photos/${thumbKey}`,
    title: file.name,
    width: Number(form.get("width")) || 0,
    height: Number(form.get("height")) || 0,
    aspectRatio: Number(form.get("aspectRatio")) || 0,
    tags: [],
    date: new Date().toISOString(),
    description: "",
    size: file.size,
    format: "PNG",
    thumbHash: (form.get("thumbHash") as string) || undefined,
  };

  await appendPhoto(c.env.MOMENT_CACHE, photo);

  return c.json(photo);
});

app.post("/api/migrate", async (c) => {
  const existing = await readManifest(c.env.MOMENT_CACHE);
  if (existing.length > 0) {
    return c.json({ migrated: false, count: existing.length, message: "KV already has data" });
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
