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
  head: () => ({
    meta: [
      { title: "My Moment — 私の瞬間" },
      { property: "og:title", content: "My Moment — 私の瞬間" },
      {
        property: "og:description",
        content: "A personal photo gallery and collection journal.",
      },
      { property: "og:image", content: "/api/og/gallery" },
      { property: "og:url", content: "/" },
      { property: "og:type", content: "website" },
    ],
  }),
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
