import type { PhotoItem } from "./photo";

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

export function filterAndSortPhotos(
  photos: PhotoItem[],
  selectedTags: string[],
  sortOrder: SortOrder,
  tagFilterMode: TagFilterMode = "union",
): PhotoItem[] {
  let filteredPhotos = [...photos];

  if (selectedTags.length > 0) {
    filteredPhotos = filteredPhotos.filter((photo) => {
      if (tagFilterMode === "intersection") {
        return selectedTags.every((tag) => photo.tags.includes(tag));
      } else {
        return selectedTags.some((tag) => photo.tags.includes(tag));
      }
    });
  }

  return filteredPhotos.sort((a, b) => {
    const aDateStr = a.date || "";
    const bDateStr = b.date || "";
    return sortOrder === "asc"
      ? aDateStr.localeCompare(bDateStr)
      : bDateStr.localeCompare(aDateStr);
  });
}

export function getAllTags(photos: PhotoItem[]): string[] {
  const tagsSet = new Set<string>();
  for (const photo of photos) {
    for (const tag of photo.tags) {
      tagsSet.add(tag);
    }
  }
  return Array.from(tagsSet).sort();
}
