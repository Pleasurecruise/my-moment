import { drizzle } from "drizzle-orm/d1";
import { eq, desc, and } from "drizzle-orm";
import { wishlistItems, type WishlistItemRow } from "../db/schema";
import type { GoodsFormData, GoodsItem, WishFormData, WishItem } from "~/types";

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
    price: data.price,
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
    price: data.price,
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
      price: data.price,
      category: data.category,
      imageKey,
      updatedAt: now,
    })
    .where(and(eq(wishlistItems.id, id), eq(wishlistItems.userId, userId)));

  return rowToWishItem({
    ...existing,
    name: data.name.trim(),
    brand: data.brand.trim() || null,
    price: data.price,
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

export async function convertWishlistItem(
  d1: D1Database,
  userId: string,
  id: string,
  data: GoodsFormData,
): Promise<GoodsItem | null> {
  const existing = await d1
    .prepare(`SELECT id FROM wishlist_items WHERE id = ? AND user_id = ?`)
    .bind(id, userId)
    .first();
  if (!existing) return null;

  const haulId = crypto.randomUUID();
  const now = new Date().toISOString();
  const imageKey = data.imageUrl?.replace(/^\/api\/photos\//, "") || null;
  await d1.batch([
    d1
      .prepare(
        `INSERT INTO haul_items
         (id, user_id, name, brand, price, category, rating, purchase_date, comment,
          image_key, purchase_link, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        haulId,
        userId,
        data.name.trim(),
        data.brand.trim() || null,
        data.price,
        data.category,
        data.rating,
        data.purchaseDate || null,
        data.comment.trim(),
        imageKey,
        data.purchaseLink?.trim() || null,
        now,
        now,
      ),
    d1.prepare(`DELETE FROM wishlist_items WHERE id = ? AND user_id = ?`).bind(id, userId),
  ]);

  return {
    id: haulId,
    name: data.name.trim(),
    brand: data.brand.trim() || undefined,
    price: data.price,
    category: data.category,
    rating: data.rating,
    purchaseDate: data.purchaseDate,
    comment: data.comment.trim(),
    imageUrl: data.imageUrl,
    purchaseLink: data.purchaseLink?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
  };
}
