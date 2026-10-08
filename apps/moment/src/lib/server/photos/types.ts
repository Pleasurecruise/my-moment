import type { PhotoItem } from "~/types";
import type { TagCount } from "~/types/photo";

export type { TagCount };

export type PhotoOrder = "asc" | "desc";

export interface TagFilter {
  names: string[];
  /** `any` matches photos with at least one tag; `all` requires every tag. */
  mode: "any" | "all";
}

export interface PhotoQuery {
  fromDate?: string;
  toDate?: string;
  tags: TagFilter;
  search?: string;
  order: PhotoOrder;
  limit: number;
  cursor?: string;
}

export interface PhotoPage {
  photos: PhotoItem[];
  nextCursor: string | null;
}

export interface CreatePhotoFromR2Input {
  r2Key: string;
  thumbnailR2Key: string;
  title: string;
  description?: string;
  tags: string[];
  date?: string;
  geo?: { lat: number; lng: number };
  thumbHash?: string;
  width: number;
  height: number;
  aspectRatio?: number;
  format?: string;
}
