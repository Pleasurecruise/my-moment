import { z } from "zod";
import type { PhotoQuery } from "./types";

const PHOTO_KEY_RE = /^img\/(?:thumbnails\/)?[^/\\%?#]+$/;

export function isValidDay(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

// Each filter tag is one bound parameter; D1 allows 100 per query.
export const MAX_FILTER_TAGS = 20;
const MAX_LIKE_PATTERN_BYTES = 50;
const LIKE_WILDCARD_BYTES = 2;

export const MAX_SEARCH_BYTES = MAX_LIKE_PATTERN_BYTES - LIKE_WILDCARD_BYTES;

/** D1 rejects LIKE patterns longer than 50 bytes. */
export const searchSchema = z
  .string()
  .trim()
  .min(1)
  .refine(
    (value) => new TextEncoder().encode(value).byteLength <= MAX_SEARCH_BYTES,
    `Search must be at most ${MAX_SEARCH_BYTES} UTF-8 bytes.`,
  );

/** A calendar day used for range filters. */
export const dateSchema = z.string().refine(isValidDay, "Date must be a valid YYYY-MM-DD value.");

/** When a photo was taken: a calendar day or a full ISO timestamp. */
export const takenAtSchema = z
  .string()
  .trim()
  .refine(
    (value) => isValidDay(value.slice(0, 10)) && !Number.isNaN(Date.parse(value)),
    "Date must be YYYY-MM-DD or an ISO 8601 timestamp.",
  );

/**
 * Gallery originals live directly under img/ and thumbnails under img/thumbnails/.
 * Collection covers use other img/ subdirectories and must never become photos,
 * because deleting a photo deletes its objects.
 */
export const photoKeySchema = z
  .string()
  .trim()
  .refine(
    (key) => PHOTO_KEY_RE.test(key) && !key.split("/").some((segment) => /^\.+$/.test(segment)),
    "Expected an R2 key directly below img/ or img/thumbnails/.",
  );

export const photoCreateSchema = z.object({
  r2Key: photoKeySchema,
  thumbnailR2Key: photoKeySchema,
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional(),
  tags: z.array(z.string().trim().min(1).max(50)).max(10).default([]),
  date: takenAtSchema.optional(),
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

export function normalizeTags(tags: readonly string[]): string[] {
  return [...new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean))];
}

/** Query string for paginated photo lists, shared by the gallery and REST API. */
export const photoListQuerySchema = z
  .object({
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(25),
    search: searchSchema.optional(),
    fromDate: dateSchema.optional(),
    toDate: dateSchema.optional(),
    tags: z
      .string()
      .refine((value) => value.split(",").length <= MAX_FILTER_TAGS, "Too many tags.")
      .default(""),
    tagMode: z.enum(["any", "all"]).default("any"),
    order: z.enum(["asc", "desc"]).default("desc"),
  })
  .transform(({ tags, tagMode, ...query }): PhotoQuery => ({
    ...query,
    tags: {
      names: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      mode: tagMode,
    },
  }));
