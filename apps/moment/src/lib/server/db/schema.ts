import { index, integer, real, sqliteTable, primaryKey, text } from "drizzle-orm/sqlite-core";

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

// ---- Photos ----

export const photos = sqliteTable(
  "photos",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    url: text("url").notNull(),
    thumbnailUrl: text("thumbnail_url").notNull(),
    thumbHash: text("thumb_hash"),
    title: text("title").notNull().default(""),
    description: text("description").default(""),
    width: integer("width").notNull().default(0),
    height: integer("height").notNull().default(0),
    aspectRatio: real("aspect_ratio"),
    size: integer("size"),
    format: text("format"),
    date: text("date"),
    geoLat: real("geo_lat"),
    geoLng: real("geo_lng"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [
    index("idx_photos_user").on(t.userId),
    index("idx_photos_date").on(t.date),
    index("idx_photos_created").on(t.userId, t.createdAt),
  ],
);

export type PhotoRow = typeof photos.$inferSelect;

// ---- Tags ----

export const tags = sqliteTable("tags", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: text("created_at").notNull(),
});

export type TagRow = typeof tags.$inferSelect;

// ---- Photo-Tags junction ----

export const photoTags = sqliteTable(
  "photo_tags",
  {
    photoId: text("photo_id").notNull().references(() => photos.id, { onDelete: "cascade" }),
    tagId: text("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.photoId, t.tagId] }),
    index("idx_photo_tags_tag").on(t.tagId),
  ],
);

export type PhotoTagRow = typeof photoTags.$inferSelect;
