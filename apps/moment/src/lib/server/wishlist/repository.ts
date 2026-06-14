import type { D1Database } from "@cloudflare/workers-types";
import { drizzle } from "drizzle-orm/d1";
import { eq, desc, and } from "drizzle-orm";
import { wishlistItems, type WishlistItemRow } from "../db/schema";
import type { WishFormData, WishItem } from "~/modules/haul/types";

function rowToWishItem(row: WishlistItemRow): WishItem {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand ?? undefined,
    price: row.price,
    category: row.category,
    imageUrl: row.imageKey ? `/api/photos/${row.imageKey}` : undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function listWishlistItems(d1: D1Database, userId: string): Promise<WishItem[]> {
  const db = drizzle(d1);
  const rows = await db
    .select()
    .from(wishlistItems)
    .where(eq(wishlistItems.userId, userId))
    .orderBy(desc(wishlistItems.createdAt));

  return rows.map(rowToWishItem);
}

export async function listAllWishlistItems(d1: D1Database): Promise<WishItem[]> {
  const db = drizzle(d1);
  const rows = await db.select().from(wishlistItems).orderBy(desc(wishlistItems.createdAt));

  return rows.map(rowToWishItem);
}

export async function getWishlistItem(d1: D1Database, id: string): Promise<WishItem | null> {
  const db = drizzle(d1);
  const [row] = await db.select().from(wishlistItems).where(eq(wishlistItems.id, id)).limit(1);
  if (!row) return null;
  return rowToWishItem(row);
}

export async function createWishlistItem(
  d1: D1Database,
  userId: string,
  data: WishFormData,
): Promise<WishItem> {
  const db = drizzle(d1);
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  const imageKey = data.imageUrl?.replace(/^\/api\/photos\//, "") || null;

  await db.insert(wishlistItems).values({
    id,
    userId,
    name: data.name.trim(),
    brand: data.brand.trim() || null,
    price: parseFloat(data.price) || 0,
    category: data.category,
    imageKey,
    createdAt: now,
    updatedAt: now,
  });

  return rowToWishItem({
    id,
    userId,
    name: data.name.trim(),
    brand: data.brand.trim() || null,
    price: parseFloat(data.price) || 0,
    category: data.category,
    imageKey,
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateWishlistItem(
  d1: D1Database,
  userId: string,
  id: string,
  data: WishFormData,
): Promise<WishItem | null> {
  const db = drizzle(d1);

  const [existing] = await db
    .select()
    .from(wishlistItems)
    .where(and(eq(wishlistItems.id, id), eq(wishlistItems.userId, userId)))
    .limit(1);

  if (!existing) return null;

  const now = new Date().toISOString();
  const imageKey = data.imageUrl?.replace(/^\/api\/photos\//, "") || null;

  await db
    .update(wishlistItems)
    .set({
      name: data.name.trim(),
      brand: data.brand.trim() || null,
      price: parseFloat(data.price) || 0,
      category: data.category,
      imageKey,
      updatedAt: now,
    })
    .where(and(eq(wishlistItems.id, id), eq(wishlistItems.userId, userId)));

  return rowToWishItem({
    ...existing,
    name: data.name.trim(),
    brand: data.brand.trim() || null,
    price: parseFloat(data.price) || 0,
    category: data.category,
    imageKey,
    updatedAt: now,
  });
}

export async function deleteWishlistItem(
  d1: D1Database,
  userId: string,
  id: string,
): Promise<boolean> {
  const db = drizzle(d1);

  const [existing] = await db
    .select({ id: wishlistItems.id })
    .from(wishlistItems)
    .where(and(eq(wishlistItems.id, id), eq(wishlistItems.userId, userId)))
    .limit(1);

  if (!existing) return false;

  await db.delete(wishlistItems).where(eq(wishlistItems.id, id));
  return true;
}
