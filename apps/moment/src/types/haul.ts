import { z } from "zod";

const categorySchema = z.enum([
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
]);

const ratingSchema = z.enum(["worth", "great", "amazing", "godtier"]);

export type Category = z.infer<typeof categorySchema>;
export type Rating = z.infer<typeof ratingSchema>;

export const RATING_CONFIG: Record<Rating, { label: string; color: string; description: string }> =
  {
    worth: {
      label: "Worth",
      color: "var(--color-success)",
      description: "Good value for daily use",
    },
    great: {
      label: "Great",
      color: "var(--color-primary)",
      description: "Exceeded expectations, would repurchase",
    },
    amazing: {
      label: "Amazing",
      color: "var(--color-warning)",
      description: "Can't go back after using it",
    },
    godtier: {
      label: "God Tier",
      color: "var(--color-info)",
      description: "Best in class, no-brainer recommendation",
    },
  };

export const CATEGORY_CONFIG: Record<Category, { label: string }> = {
  digital: { label: "Digital" },
  audio: { label: "Audio" },
  home: { label: "Home" },
  kitchen: { label: "Kitchen" },
  wear: { label: "Wear" },
  travel: { label: "Travel" },
  health: { label: "Health" },
  stationery: { label: "Stationery" },
  gaming: { label: "Gaming" },
  other: { label: "Other" },
};

export const goodsItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  brand: z.string().optional(),
  price: z.number(),
  category: categorySchema,
  rating: ratingSchema,
  purchaseDate: z.string(),
  comment: z.string(),
  imageUrl: z.string().optional(),
  purchaseLink: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type GoodsItem = z.infer<typeof goodsItemSchema>;

const priceSchema = z
  .string()
  .trim()
  .min(1, "price is required")
  .transform(Number)
  .pipe(z.number().finite("invalid price").nonnegative("invalid price"));

export const goodsFormSchema = z.object({
  name: z.string().trim().min(1, "name is required"),
  brand: z.string().trim(),
  price: priceSchema,
  category: categorySchema,
  rating: ratingSchema,
  purchaseDate: z.string(),
  comment: z.string().trim().min(1, "comment is required"),
  imageUrl: z.string().optional(),
  purchaseLink: z.string().optional(),
});

export const wishFormSchema = z.object({
  name: z.string().trim().min(1, "name is required"),
  brand: z.string().trim(),
  price: priceSchema,
  category: categorySchema,
  imageUrl: z.string().optional(),
});

export type GoodsFormInput = z.input<typeof goodsFormSchema>;
export type GoodsFormData = z.output<typeof goodsFormSchema>;
export type WishFormInput = z.input<typeof wishFormSchema>;
export type WishFormData = z.output<typeof wishFormSchema>;

export interface FilterState {
  search: string;
  categories: Category[];
  ratings: Rating[];
  sortBy: "newest" | "price-asc" | "price-desc" | "rating";
}

export const wishItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  brand: z.string().optional(),
  price: z.number(),
  category: categorySchema,
  imageUrl: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type WishItem = z.infer<typeof wishItemSchema>;

export interface WishFilterState {
  search: string;
  categories: Category[];
  sortBy: "newest" | "price-asc" | "price-desc";
}
