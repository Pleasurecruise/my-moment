import { createFileRoute } from "@tanstack/solid-router";
import { createResource } from "solid-js";
import { PhotosRoot } from "~/modules/gallery/PhotosRoot";
import type { PhotoItem } from "~/types/photo";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const [photos] = createResource<PhotoItem[]>(async () => {
    const res = await fetch("/api/gallery");
    return res.json();
  });

  return <PhotosRoot photos={photos() ?? []} />;
}
