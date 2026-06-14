import type { D1Database } from "@cloudflare/workers-types";
import { drizzle } from "drizzle-orm/d1";
import { eq, desc, and, inArray } from "drizzle-orm";
import { photos, tags, photoTags, type PhotoRow } from "../db/schema";

export interface PhotoItem {
  id: string;
  url: string;
  thumbnailUrl: string;
  thumbHash?: string;
  title: string;
  width: number;
  height: number;
  aspectRatio?: number;
  tags: string[];
  date?: string;
  description?: string;
  size?: number;
  format?: string;
  geo?: { lat: number; lng: number };
}

function rowToItem(row: PhotoRow, tagNames: string[]): PhotoItem {
  return {
    id: row.id,
    url: row.url,
    thumbnailUrl: row.thumbnailUrl,
    thumbHash: row.thumbHash ?? undefined,
    title: row.title,
    width: row.width,
    height: row.height,
    aspectRatio: row.aspectRatio ?? undefined,
    tags: tagNames,
    date: row.date ?? undefined,
    description: row.description ?? undefined,
    size: row.size ?? undefined,
    format: row.format ?? undefined,
    geo: row.geoLat != null && row.geoLng != null ? { lat: row.geoLat, lng: row.geoLng } : undefined,
  };
}

async function getTagsForPhotos(db: ReturnType<typeof drizzle>, photoIds: string[]): Promise<Map<string, string[]>> {
  if (photoIds.length === 0) return new Map();

  const rows = await db
    .select({
      photoId: photoTags.photoId,
      tagName: tags.name,
    })
    .from(photoTags)
    .innerJoin(tags, eq(photoTags.tagId, tags.id))
    .where(inArray(photoTags.photoId, photoIds));

  const map = new Map<string, string[]>();
  for (const row of rows) {
    if (!map.has(row.photoId)) map.set(row.photoId, []);
    map.get(row.photoId)!.push(row.tagName);
  }
  return map;
}

export async function listPhotos(d1: D1Database, userId?: string): Promise<PhotoItem[]> {
  const db = drizzle(d1);
  const query = userId
    ? db.select().from(photos).where(eq(photos.userId, userId)).orderBy(desc(photos.date))
    : db.select().from(photos).orderBy(desc(photos.date));

  const rows = await query;
  const ids = rows.map((r) => r.id);
  const tagMap = await getTagsForPhotos(db, ids);

  return rows.map((row) => rowToItem(row, tagMap.get(row.id) ?? []));
}

export async function getPhoto(d1: D1Database, id: string): Promise<PhotoItem | null> {
  const db = drizzle(d1);
  const [row] = await db.select().from(photos).where(eq(photos.id, id)).limit(1);
  if (!row) return null;

  const tagMap = await getTagsForPhotos(db, [id]);
  return rowToItem(row, tagMap.get(id) ?? []);
}

export async function createPhoto(
  d1: D1Database,
  userId: string,
  data: {
    url: string;
    thumbnailUrl: string;
    thumbHash?: string;
    title: string;
    width: number;
    height: number;
    aspectRatio?: number;
    size?: number;
    format?: string;
    date?: string;
    description?: string;
    geo?: { lat: number; lng: number };
    tags: string[];
  },
): Promise<PhotoItem> {
  const db = drizzle(d1);
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  await db.insert(photos).values({
    id,
    userId,
    url: data.url,
    thumbnailUrl: data.thumbnailUrl,
    thumbHash: data.thumbHash ?? null,
    title: data.title ?? "",
    description: data.description ?? null,
    width: data.width ?? 0,
    height: data.height ?? 0,
    aspectRatio: data.aspectRatio ?? null,
    size: data.size ?? null,
    format: data.format ?? null,
    date: data.date ?? null,
    geoLat: data.geo?.lat ?? null,
    geoLng: data.geo?.lng ?? null,
    createdAt: now,
    updatedAt: now,
  });

  // Upsert tags and link
  if (data.tags.length > 0) {
    await upsertTagsAndLink(db, id, data.tags);
  }

  return {
    id,
    url: data.url,
    thumbnailUrl: data.thumbnailUrl,
    thumbHash: data.thumbHash,
    title: data.title ?? "",
    width: data.width ?? 0,
    height: data.height ?? 0,
    aspectRatio: data.aspectRatio,
    tags: data.tags,
    date: data.date,
    description: data.description,
    size: data.size,
    format: data.format,
    geo: data.geo,
  };
}

export async function updatePhoto(
  d1: D1Database,
  id: string,
  data: {
    title?: string;
    description?: string;
    tags?: string[];
  },
): Promise<PhotoItem | null> {
  const db = drizzle(d1);

  const [existing] = await db.select().from(photos).where(eq(photos.id, id)).limit(1);
  if (!existing) return null;

  const now = new Date().toISOString();
  const updates: Record<string, unknown> = { updatedAt: now };

  if (data.title !== undefined) updates.title = data.title;
  if (data.description !== undefined) updates.description = data.description;

  await db.update(photos).set(updates).where(eq(photos.id, id));

  // Replace tags if provided
  if (data.tags !== undefined) {
    await db.delete(photoTags).where(eq(photoTags.photoId, id));
    if (data.tags.length > 0) {
      await upsertTagsAndLink(db, id, data.tags);
    }
  }

  return getPhoto(d1, id);
}

export async function deletePhoto(d1: D1Database, id: string): Promise<boolean> {
  const db = drizzle(d1);

  const [existing] = await db.select({ id: photos.id }).from(photos).where(eq(photos.id, id)).limit(1);
  if (!existing) return false;

  // photoTags will cascade delete
  await db.delete(photos).where(eq(photos.id, id));
  return true;
}

// ---- Tag management ----

async function upsertTagsAndLink(db: ReturnType<typeof drizzle>, photoId: string, tagNames: string[]) {
  const normalized = [...new Set(tagNames.map((t) => t.trim().toLowerCase()).filter(Boolean))];
  if (normalized.length === 0) return;

  for (const name of normalized) {
    // Upsert tag
    const existing = await db.select().from(tags).where(eq(tags.name, name)).limit(1);
    let tagId: string;

    if (existing.length > 0) {
      tagId = existing[0].id;
    } else {
      tagId = crypto.randomUUID();
      await db.insert(tags).values({ id: tagId, name, createdAt: new Date().toISOString() });
    }

    // Link (ignore if already exists)
    await db.insert(photoTags).values({ photoId, tagId }).onConflictDoNothing();
  }
}

export async function getAllTags(d1: D1Database): Promise<string[]> {
  const db = drizzle(d1);
  const rows = await db.select({ name: tags.name }).from(tags).orderBy(tags.name);
  return rows.map((r) => r.name);
}

export async function renameTag(d1: D1Database, oldName: string, newName: string): Promise<boolean> {
  const db = drizzle(d1);
  const normalized = newName.trim().toLowerCase();

  const [existing] = await db.select().from(tags).where(eq(tags.name, oldName)).limit(1);
  if (!existing) return false;

  // Check if new name already exists
  const [conflict] = await db.select().from(tags).where(eq(tags.name, normalized)).limit(1);
  if (conflict) return false;

  await db.update(tags).set({ name: normalized }).where(eq(tags.id, existing.id));
  return true;
}

export async function deleteTag(d1: D1Database, name: string): Promise<boolean> {
  const db = drizzle(d1);

  const [existing] = await db.select().from(tags).where(eq(tags.name, name)).limit(1);
  if (!existing) return false;

  // photoTags will cascade delete
  await db.delete(tags).where(eq(tags.id, existing.id));
  return true;
}
