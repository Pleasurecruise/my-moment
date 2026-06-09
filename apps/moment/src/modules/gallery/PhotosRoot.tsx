import { createSignal } from "solid-js";
import { Segment } from "~/components/Segment";
import { MasonryView } from "./MasonryView";
import { ListView } from "./ListView";
import { PhotoViewer } from "~/modules/viewer/PhotoViewer";
import type { PhotoItem } from "~/types/photo";

type ViewMode = "grid" | "list";

const VIEW_OPTIONS = [
  { value: "grid" as const, label: "Grid" },
  { value: "list" as const, label: "List" },
];

interface PhotosRootProps {
  photos: PhotoItem[];
}

export function PhotosRoot(props: PhotosRootProps) {
  const [viewMode, setViewMode] = createSignal<ViewMode>("grid");
  const [viewerIndex, setViewerIndex] = createSignal<number | null>(null);

  const photos = () => props.photos;

  return (
    <div>
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold text-foreground">Moments</h2>
          <p class="mt-1 text-sm text-muted-foreground">
            {photos().length} photo{photos().length !== 1 ? "s" : ""}
          </p>
        </div>
        <Segment<ViewMode> options={VIEW_OPTIONS} value={viewMode()} onChange={setViewMode} />
      </div>

      <div id="gallery-scroll-container" class="h-full overflow-auto">
        {viewMode() === "grid" ? (
          <MasonryView photos={photos()} onPhotoClick={(i) => setViewerIndex(i)} />
        ) : (
          <ListView photos={photos()} onPhotoClick={(i) => setViewerIndex(i)} />
        )}
      </div>

      {viewerIndex() !== null && (
        <PhotoViewer
          photos={photos()}
          index={viewerIndex()!}
          onClose={() => setViewerIndex(null)}
          onIndexChange={(i) => setViewerIndex(i)}
        />
      )}
    </div>
  );
}
