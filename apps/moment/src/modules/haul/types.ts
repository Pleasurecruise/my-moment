export type Rating = "worth" | "great" | "amazing" | "godtier";

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

export interface GoodsFormData {
  name: string;
  brand: string;
  price: string;
  category: Category;
  rating: Rating;
  purchaseDate: string;
  comment: string;
  imageUrl?: string;
  purchaseLink?: string;
}

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
  purchaseLink?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WishFormData {
  name: string;
  brand: string;
  price: string;
  category: Category;
  imageUrl?: string;
  purchaseLink?: string;
}

export interface WishFilterState {
  search: string;
  categories: Category[];
  sortBy: "newest" | "price-asc" | "price-desc";
}
