import { Hono } from "hono";
import type { WorkerEnv } from "../access";
import { verifyApiKey } from "../apikey";
import {
  createPhotoFromR2,
  deletePhoto,
  getPhoto,
  isValidCursor,
  listPhotos,
  updatePhoto,
} from "../photos/service";
import { photoCreateSchema, photoListQuerySchema } from "../photos/schema";
import { photoUpdateSchema } from "~/types/photo";
import { PhotoDomainError } from "../photos/errors";

export const photoApi = new Hono<WorkerEnv>();

photoApi.onError((error, c) => {
  if (error instanceof PhotoDomainError) {
    return c.json({ error: error.message, code: error.code }, error.httpStatus);
  }
  throw error;
});

photoApi.get("/", async (c) => {
  if (!(await verifyApiKey(c.req.raw, c.env.API_KEY))) {
    c.header("WWW-Authenticate", "Bearer");
    return c.json({ error: "Unauthorized." }, 401);
  }

  const query = photoListQuerySchema.safeParse(
    Object.fromEntries(new URL(c.req.url).searchParams.entries()),
  );
  if (!query.success) return c.json({ error: "Invalid query parameters." }, 400);
  if (query.data.cursor && !isValidCursor(query.data.cursor)) {
    return c.json({ error: "Invalid cursor." }, 400);
  }
  return c.json(await listPhotos(c.env.DB, query.data));
});

photoApi.post("/", async (c) => {
  if (!(await verifyApiKey(c.req.raw, c.env.API_KEY))) {
    c.header("WWW-Authenticate", "Bearer");
    return c.json({ error: "Unauthorized." }, 401);
  }

  const input = photoCreateSchema.safeParse(await c.req.json().catch(() => null));
  if (!input.success) return c.json({ error: "Invalid photo payload." }, 400);
  const photo = await createPhotoFromR2(
    c.env.DB,
    c.env.MOMENT_BUCKET,
    c.env.ALLOWED_EMAIL,
    input.data,
  );
  return c.json({ photo }, 201);
});

photoApi.get("/:id", async (c) => {
  if (!(await verifyApiKey(c.req.raw, c.env.API_KEY))) {
    c.header("WWW-Authenticate", "Bearer");
    return c.json({ error: "Unauthorized." }, 401);
  }

  const photo = await getPhoto(c.env.DB, c.req.param("id"));
  if (!photo) return c.json({ error: "Photo not found." }, 404);
  return c.json({ photo });
});

photoApi.patch("/:id", async (c) => {
  if (!(await verifyApiKey(c.req.raw, c.env.API_KEY))) {
    c.header("WWW-Authenticate", "Bearer");
    return c.json({ error: "Unauthorized." }, 401);
  }

  const input = photoUpdateSchema.safeParse(await c.req.json().catch(() => null));
  if (!input.success) return c.json({ error: "Invalid photo payload." }, 400);
  if (Object.keys(input.data).length === 0) {
    return c.json({ error: "No photo changes provided." }, 400);
  }
  const photo = await updatePhoto(c.env.DB, c.req.param("id"), input.data);
  if (!photo) return c.json({ error: "Photo not found." }, 404);
  return c.json({ photo });
});

photoApi.delete("/:id", async (c) => {
  if (!(await verifyApiKey(c.req.raw, c.env.API_KEY))) {
    c.header("WWW-Authenticate", "Bearer");
    return c.json({ error: "Unauthorized." }, 401);
  }

  const deleted = await deletePhoto(c.env.DB, c.env.MOMENT_BUCKET, c.req.param("id"));
  if (!deleted) return c.json({ error: "Photo not found." }, 404);
  return c.body(null, 204);
});
