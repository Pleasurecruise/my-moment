import {
  createContext,
  createResource,
  useContext,
  type Accessor,
  type ParentProps,
} from "solid-js";
import type { PhotoItem } from "~/types/photo";

const PhotosCtx = createContext<Accessor<PhotoItem[]>>();

export function PhotosProvider(props: ParentProps & { photos?: PhotoItem[]; fetchUrl?: string }) {
  const [photos] = createResource<PhotoItem[]>(async () => {
    if (props.photos) return props.photos;
    if (props.fetchUrl) {
      const res = await fetch(props.fetchUrl);
      if (!res.ok) throw new Error("Failed to fetch photos");
      return res.json();
    }
    return [];
  });

  return <PhotosCtx.Provider value={() => photos() ?? []}>{props.children}</PhotosCtx.Provider>;
}

export function usePhotos(): Accessor<PhotoItem[]> {
  const ctx = useContext(PhotosCtx);
  if (!ctx) {
    return () => [];
  }
  return ctx;
}
