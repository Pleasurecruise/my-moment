import type { PhotoItem } from "./photo";

export type TagFilterMode = "union" | "intersection";

export type SortOrder = "asc" | "desc";

export interface DateRangeFilter {
  from?: string;
  to?: string;
}

export interface GallerySettings {
  selectedTags: string[];
  selectedDateRange: DateRangeFilter | null;
  sortOrder: SortOrder;
  tagFilterMode: TagFilterMode;
}

export const DEFAULT_GALLERY_SETTINGS: GallerySettings = {
  selectedTags: [],
  selectedDateRange: null,
  sortOrder: "desc",
  tagFilterMode: "union",
};

export function getPhotoDateMs(photo: PhotoItem): number | null {
  if (!photo.date) return null;
  const ts = new Date(photo.date).getTime();
  return Number.isNaN(ts) ? null : ts;
}

export function getRangeStartMs(dateStr: string): number {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function getRangeEndMs(dateStr: string): number {
  const d = new Date(dateStr);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

export function filterAndSortPhotos(
  photos: PhotoItem[],
  selectedTags: string[],
  selectedDateRange: DateRangeFilter | null,
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

  if (selectedDateRange && (selectedDateRange.from || selectedDateRange.to)) {
    const minMs = selectedDateRange.from ? getRangeStartMs(selectedDateRange.from) : -Infinity;
    const maxMs = selectedDateRange.to ? getRangeEndMs(selectedDateRange.to) : Infinity;
    filteredPhotos = filteredPhotos.filter((photo) => {
      const ts = getPhotoDateMs(photo);
      if (ts === null) return false;
      return ts >= minMs && ts <= maxMs;
    });
  }

  const sortedPhotos = filteredPhotos.sort((a, b) => {
    const aDateStr = a.date || "";
    const bDateStr = b.date || "";
    return sortOrder === "asc"
      ? aDateStr.localeCompare(bDateStr)
      : bDateStr.localeCompare(aDateStr);
  });

  return sortedPhotos;
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
