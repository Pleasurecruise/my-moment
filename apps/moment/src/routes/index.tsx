import { createFileRoute } from "@tanstack/solid-router";
import { createResource, onMount } from "solid-js";
import { PhotosRoot } from "~/modules/gallery/PhotosRoot";
import type { PhotoItem } from "~/types/photo";

export const Route = createFileRoute("/")({
  component: HomePage,
  staleTime: 0,
});

function HomePage() {
  const [photos, { refetch }] = createResource<PhotoItem[]>(async () => {
    const res = await fetch("/api/gallery");
    return res.json();
  });

  onMount(() => {
    refetch();
  });

  return <PhotosRoot photos={photos() ?? []} />;
}
