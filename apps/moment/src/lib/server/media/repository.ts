import { drizzle } from "drizzle-orm/d1";
import { eq, desc, and } from "drizzle-orm";
import { mediaItems, type MediaItemRow } from "../db/schema";
import type { MediaFormData, MediaItem, MediaKind } from "~/types";

function rowToItem(row: MediaItemRow): MediaItem {
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    description: row.description ?? "",
    date: row.watchedDate ?? undefined,
    imageUrl: row.imageKey ? `/api/photos/${row.imageKey}` : undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function getMediaItem(d1: D1Database, id: string): Promise<MediaItem | null> {
  const db = drizzle(d1);
  const [row] = await db.select().from(mediaItems).where(eq(mediaItems.id, id)).limit(1);
  return row ? rowToItem(row) : null;
}

export async function getOwnedMediaItem(
  d1: D1Database,
  userId: string,
  id: string,
): Promise<MediaItem | null> {
  const db = drizzle(d1);
  const [row] = await db
    .select()
    .from(mediaItems)
    .where(and(eq(mediaItems.id, id), eq(mediaItems.userId, userId)))
    .limit(1);
  return row ? rowToItem(row) : null;
}

export async function listMediaItems(d1: D1Database, kind: MediaKind): Promise<MediaItem[]> {
  const db = drizzle(d1);
  const rows = await db
    .select()
    .from(mediaItems)
    .where(eq(mediaItems.kind, kind))
    .orderBy(desc(mediaItems.watchedDate));
  return rows.map(rowToItem);
}

export async function createMediaItem(
  d1: D1Database,
  userId: string,
  data: MediaFormData,
): Promise<MediaItem> {
  const db = drizzle(d1);
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const imageKey = data.imageUrl?.replace(/^\/api\/photos\//, "") || null;

  await db.insert(mediaItems).values({
    id,
    userId,
    kind: data.kind,
    title: data.title.trim(),
    description: data.description.trim(),
    watchedDate: data.date || null,
    imageKey,
    createdAt: now,
    updatedAt: now,
  });

  return rowToItem({
    id,
    userId,
    kind: data.kind,
    title: data.title.trim(),
    description: data.description.trim(),
    watchedDate: data.date || null,
    imageKey,
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateMediaItem(
  d1: D1Database,
  userId: string,
  id: string,
  data: MediaFormData,
): Promise<MediaItem | null> {
  const db = drizzle(d1);
  const [existing] = await db
    .select()
    .from(mediaItems)
    .where(and(eq(mediaItems.id, id), eq(mediaItems.userId, userId)))
    .limit(1);
  if (!existing) return null;

  const now = new Date().toISOString();
  const imageKey = data.imageUrl?.replace(/^\/api\/photos\//, "") || null;

  await db
    .update(mediaItems)
    .set({
      kind: data.kind,
      title: data.title.trim(),
      description: data.description.trim(),
      watchedDate: data.date || null,
      imageKey,
      updatedAt: now,
    })
    .where(and(eq(mediaItems.id, id), eq(mediaItems.userId, userId)));

  return rowToItem({
    ...existing,
    kind: data.kind,
    title: data.title.trim(),
    description: data.description.trim(),
    watchedDate: data.date || null,
    imageKey,
    updatedAt: now,
  });
}

export async function deleteMediaItemMetadata(
  d1: D1Database,
  userId: string,
  id: string,
): Promise<boolean> {
  const db = drizzle(d1);
  const [existing] = await db
    .select({ id: mediaItems.id })
    .from(mediaItems)
    .where(and(eq(mediaItems.id, id), eq(mediaItems.userId, userId)))
    .limit(1);
  if (!existing) return false;

  await db.delete(mediaItems).where(eq(mediaItems.id, id));
  return true;
}
