import type { D1Database } from "@cloudflare/workers-types";
import { drizzle } from "drizzle-orm/d1";
import { eq, desc, and } from "drizzle-orm";
import { haulItems, type HaulItemRow } from "../db/schema";
import type { GoodsFormData, GoodsItem } from "~/modules/haul/types";

function rowToItem(row: HaulItemRow): GoodsItem {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand ?? undefined,
    price: row.price,
    category: row.category,
    rating: row.rating,
    purchaseDate: row.purchaseDate ?? "",
    comment: row.comment,
    imageUrl: row.imageKey ? `/api/photos/${row.imageKey}` : undefined,
    purchaseLink: row.purchaseLink ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function listHaulItems(d1: D1Database, userId: string): Promise<GoodsItem[]> {
  const db = drizzle(d1);
  const rows = await db
    .select()
    .from(haulItems)
    .where(eq(haulItems.userId, userId))
    .orderBy(desc(haulItems.purchaseDate));

  return rows.map(rowToItem);
}

export async function listAllHaulItems(d1: D1Database): Promise<GoodsItem[]> {
  const db = drizzle(d1);
  const rows = await db.select().from(haulItems).orderBy(desc(haulItems.purchaseDate));

  return rows.map(rowToItem);
}

export async function createHaulItem(
  d1: D1Database,
  userId: string,
  data: GoodsFormData,
): Promise<GoodsItem> {
  const db = drizzle(d1);
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  // Extract image key from URL (e.g., /api/photos/img/haul/image01.png -> img/haul/image01.png)
  const imageKey = data.imageUrl?.replace(/^\/api\/photos\//, "") || null;

  await db.insert(haulItems).values({
    id,
    userId,
    name: data.name.trim(),
    brand: data.brand.trim() || null,
    price: parseFloat(data.price) || 0,
    category: data.category,
    rating: data.rating,
    purchaseDate: data.purchaseDate || null,
    comment: data.comment.trim(),
    imageKey,
    purchaseLink: data.purchaseLink?.trim() || null,
    createdAt: now,
    updatedAt: now,
  });

  return rowToItem({
    id,
    userId,
    name: data.name.trim(),
    brand: data.brand.trim() || null,
    price: parseFloat(data.price) || 0,
    category: data.category,
    rating: data.rating,
    purchaseDate: data.purchaseDate || null,
    comment: data.comment.trim(),
    imageKey,
    purchaseLink: data.purchaseLink?.trim() || null,
    createdAt: now,
    updatedAt: now,
  });
}

export async function deleteHaulItem(d1: D1Database, userId: string, id: string): Promise<boolean> {
  const db = drizzle(d1);

  const [existing] = await db
    .select({ id: haulItems.id })
    .from(haulItems)
    .where(and(eq(haulItems.id, id), eq(haulItems.userId, userId)))
    .limit(1);

  if (!existing) return false;

  await db.delete(haulItems).where(eq(haulItems.id, id));
  return true;
}
