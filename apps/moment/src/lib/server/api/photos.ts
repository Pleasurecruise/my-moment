import { Hono } from "hono";
import { z } from "zod";
import type { WorkerEnv } from "../access";
import { verifyApiKey } from "../apikey";
import {
  createPhotoFromR2,
  deletePhoto,
  getPhoto,
  listPhotoMetadata,
  searchPhotoMetadata,
  updatePhoto,
} from "../photos/service";
import { photoUpdateSchema } from "~/types/photo";
import { PhotoDomainError } from "../photos/errors";

const r2ObjectKeySchema = z
  .string()
  .trim()
  .min(1)
  .refine(
    (key) =>
      key.startsWith("img/") &&
      !/[\\%?#]/.test(key) &&
      !key.split("/").some((segment) => segment === "." || segment === ".."),
    "Expected a safe R2 object key below img/.",
  );

const listPhotoQuerySchema = z.object({
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  tags: z.string().optional(),
  search: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const createPhotoSchema = z.object({
  r2Key: r2ObjectKeySchema,
  thumbnailR2Key: r2ObjectKeySchema,
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional(),
  tags: z.array(z.string().trim().min(1).max(50)).max(10).default([]),
  date: z.string().trim().optional(),
  geo: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    })
    .optional(),
  thumbHash: z.string().optional(),
  width: z.number().int().min(0),
  height: z.number().int().min(0),
  aspectRatio: z.number().positive().optional(),
  format: z.string().trim().min(1).optional(),
});

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

  const query = listPhotoQuerySchema.safeParse(
    Object.fromEntries(new URL(c.req.url).searchParams.entries()),
  );
  if (!query.success) return c.json({ error: "Invalid query parameters." }, 400);

  const tags = query.data.tags
    ? query.data.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
    : [];
  const photos = query.data.search
    ? await searchPhotoMetadata(c.env.DB, {
        query: query.data.search,
        limit: query.data.limit,
      })
    : await listPhotoMetadata(c.env.DB, {
        fromDate: query.data.fromDate,
        toDate: query.data.toDate,
        tags,
        limit: query.data.limit,
      });
  return c.json({ photos });
});

photoApi.post("/", async (c) => {
  if (!(await verifyApiKey(c.req.raw, c.env.API_KEY))) {
    c.header("WWW-Authenticate", "Bearer");
    return c.json({ error: "Unauthorized." }, 401);
  }

  const input = createPhotoSchema.safeParse(await c.req.json());
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

  const input = photoUpdateSchema.safeParse(await c.req.json());
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
