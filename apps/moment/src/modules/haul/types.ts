export type Rating = "worth" | "great" | "amazing" | "godtier";

import { z } from "zod";

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

export type Category =
  | "digital"
  | "audio"
  | "home"
  | "kitchen"
  | "wear"
  | "travel"
  | "health"
  | "stationery"
  | "gaming"
  | "other";

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

export interface GoodsItem {
  id: string;
  name: string;
  brand?: string;
  price: number;
  category: Category;
  rating: Rating;
  purchaseDate: string;
  comment: string;
  imageUrl?: string;
  purchaseLink?: string;
  createdAt: string;
  updatedAt: string;
}

export const goodsFormSchema = z.object({
  name: z.string().trim().min(1, "name is required"),
  brand: z.string().trim(),
  price: z
    .string()
    .min(1, "price is required")
    .refine((v) => !Number.isNaN(Number(v)) && Number(v) >= 0, "invalid price"),
  category: z.enum([
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
  ]),
  rating: z.enum(["worth", "great", "amazing", "godtier"]),
  purchaseDate: z.string(),
  comment: z.string().trim().min(1, "comment is required"),
  imageUrl: z.string().optional(),
  purchaseLink: z.string().optional(),
});

export const wishFormSchema = z.object({
  name: z.string().trim().min(1, "name is required"),
  brand: z.string().trim(),
  price: z
    .string()
    .min(1, "price is required")
    .refine((v) => !Number.isNaN(Number(v)) && Number(v) >= 0, "invalid price"),
  category: z.enum([
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
  ]),
  imageUrl: z.string().optional(),
});

export type GoodsFormData = z.infer<typeof goodsFormSchema>;
export type WishFormData = z.infer<typeof wishFormSchema>;

export interface FilterState {
  search: string;
  categories: Category[];
  ratings: Rating[];
  sortBy: "newest" | "price-asc" | "price-desc" | "rating";
}

export type ViewMode = "grid" | "list";

export interface WishItem {
  id: string;
  name: string;
  brand?: string;
  price: number;
  category: Category;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WishFilterState {
  search: string;
  categories: Category[];
  sortBy: "newest" | "price-asc" | "price-desc";
}
