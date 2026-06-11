import { Hono } from "hono";
import { getAuth } from "./src/lib/auth";

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
  const cached = await c.env.MOMENT_CACHE.get("manifest", "json");
  if (cached) return c.json(cached);

  const obj = await c.env.MOMENT_BUCKET.get("manifest.json");
  if (!obj) return c.json([]);

  const data = await obj.json();
  await c.env.MOMENT_CACHE.put("manifest", JSON.stringify(data), { expirationTtl: 300 });
  return c.json(data);
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
  if (!allowed) return c.json({ error: "ALLOWED_EMAIL not configured" }, 500);

  const auth = getAuth(c.env);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user?.email) return c.json({ error: "Unauthorized" }, 401);
  if (session.user.email !== allowed) return c.json({ error: "Forbidden" }, 403);

  const form = await c.req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return c.json({ error: "No file provided" }, 400);

  const mimeMap: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/avif": "avif",
  };
  const ext = mimeMap[file.type] ?? "bin";

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

  const key = `img/image${maxNum + 1}.${ext}`;

  await c.env.MOMENT_BUCKET.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
  });

  // Invalidate gallery cache so new photo appears on next fetch
  await c.env.MOMENT_CACHE.delete("manifest");

  return c.json({ key, name: file.name, size: file.size });
});

app.get("/api/gallery/invalidate", async (c) => {
  await c.env.MOMENT_CACHE.delete("manifest");
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
