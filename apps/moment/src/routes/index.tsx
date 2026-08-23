import { createFileRoute } from "@tanstack/solid-router";
import { createMemo, Errored, Loading } from "solid-js";
import { z } from "zod";
import { Spinner } from "@my-moment/ui";
import { PhotosRoot } from "~/modules/gallery/PhotosRoot";
import { photoItemSchema } from "~/types";
import { publicPageMeta } from "~/lib/seo";

const galleryResponseSchema = z.object({
  photos: z.array(photoItemSchema),
  canUpload: z.boolean(),
});

type GalleryResponse = z.infer<typeof galleryResponseSchema>;

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: publicPageMeta("gallery"),
  }),
  staleTime: 0,
});

function HomePage() {
  const gallery = createMemo<GalleryResponse>(async () => {
    const res = await fetch("/api/gallery");
    if (!res.ok) throw new Error("Failed to load gallery");
    return galleryResponseSchema.parse(await res.json());
  });

  const photos = () => gallery().photos;
  const canUpload = () => gallery().canUpload;

  return (
    <Errored
      fallback={<p class="py-16 text-center text-sm text-destructive">Failed to load gallery.</p>}
    >
      <Loading
        fallback={
          <div class="flex items-center justify-center gap-2 py-20 text-muted-foreground">
            <Spinner size="sm" />
            <p class="text-sm">Loading...</p>
          </div>
        }
      >
        <PhotosRoot photos={photos()} canUpload={canUpload()} />
      </Loading>
    </Errored>
  );
}
