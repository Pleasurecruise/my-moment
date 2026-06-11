import { createFileRoute } from "@tanstack/solid-router";
import { createResource, onMount } from "solid-js";
import { PhotosRoot } from "~/modules/gallery/PhotosRoot";
import type { PhotoItem } from "~/types/photo";

interface GalleryResponse {
  photos: PhotoItem[];
  canUpload: boolean;
}

export const Route = createFileRoute("/")({
  component: HomePage,
  staleTime: 0,
});

function HomePage() {
  const [gallery, { refetch }] = createResource<GalleryResponse>(async () => {
    const res = await fetch("/api/gallery");
    return res.json();
  });

  onMount(() => {
    refetch();
  });

  const photos = () => gallery()?.photos ?? [];
  const canUpload = () => gallery()?.canUpload ?? false;

  return <PhotosRoot photos={photos()} canUpload={canUpload()} />;
}
