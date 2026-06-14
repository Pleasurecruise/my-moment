import { index, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const haulItems = sqliteTable(
  "haul_items",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    brand: text("brand"),
    price: real("price").notNull().default(0),
    category: text("category", {
      enum: [
        "digital",
        "audio",
        "home",
        "kitchen",
        "wear",
        "travel",
        "health",
        "stationery",
        "gaming",
        "other",
      ],
    }).notNull(),
    rating: text("rating", {
      enum: ["worth", "great", "amazing", "godtier"],
    }).notNull(),
    purchaseDate: text("purchase_date"),
    comment: text("comment").notNull().default(""),
    imageKey: text("image_key"),
    purchaseLink: text("purchase_link"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [index("haul_user_idx").on(t.userId), index("haul_created_idx").on(t.userId, t.createdAt)],
);

export type HaulItemRow = typeof haulItems.$inferSelect;

export const wishlistItems = sqliteTable(
  "wishlist_items",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    brand: text("brand"),
    price: real("price").notNull().default(0),
    category: text("category", {
      enum: [
        "digital",
        "audio",
        "home",
        "kitchen",
        "wear",
        "travel",
        "health",
        "stationery",
        "gaming",
        "other",
      ],
    }).notNull(),
    imageKey: text("image_key"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [
    index("wishlist_user_idx").on(t.userId),
    index("wishlist_created_idx").on(t.userId, t.createdAt),
  ],
);

export type WishlistItemRow = typeof wishlistItems.$inferSelect;
