export type TagFilterMode = "union" | "intersection";

export type SortOrder = "asc" | "desc";

export interface GallerySettings {
  selectedTags: string[];
  sortOrder: SortOrder;
  tagFilterMode: TagFilterMode;
}

export const DEFAULT_GALLERY_SETTINGS: GallerySettings = {
  selectedTags: [],
  sortOrder: "desc",
  tagFilterMode: "union",
};
