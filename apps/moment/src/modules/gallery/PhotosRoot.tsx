import { createSignal, createMemo, Show } from "solid-js";
import { Link } from "@tanstack/solid-router";
import { Upload, SlidersHorizontal } from "lucide-solid";
import { Segment } from "~/components/Segment";
import { Button } from "@my-moment/ui";
import { MasonryView } from "./MasonryView";
import { ListView } from "./ListView";
import { FilterPanel, ActiveFilterChips } from "./FilterPanel";
import { PhotoViewer } from "~/modules/viewer/PhotoViewer";
import type { PhotoItem } from "~/types/photo";
import { useGallerySettings } from "~/providers/gallery-settings-provider";
import { filterAndSortPhotos } from "~/types/gallery";

type ViewMode = "grid" | "list";

const VIEW_OPTIONS = [
  { value: "grid" as const, label: "Grid" },
  { value: "list" as const, label: "List" },
];

interface PhotosRootProps {
  photos: PhotoItem[];
  canUpload?: boolean;
}

export function PhotosRoot(props: PhotosRootProps) {
  const { settings } = useGallerySettings();
  const [viewMode, setViewMode] = createSignal<ViewMode>("grid");
  const [viewerIndex, setViewerIndex] = createSignal<number | null>(null);
  const [showFilters, setShowFilters] = createSignal(false);

  const allPhotos = () => props.photos;

  const filteredPhotos = createMemo(() => {
    const { selectedTags, sortOrder, tagFilterMode } = settings();
    return filterAndSortPhotos(allPhotos(), selectedTags, sortOrder, tagFilterMode);
  });

  return (
    <div>
      <div class="mb-6 flex items-center justify-between">
        <div>
          <div class="flex items-center gap-2">
            <h2 class="text-lg font-semibold text-foreground">Moments</h2>
            <Show when={props.canUpload}>
              <Link
                to="/upload"
                class="flex size-5 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Upload photos"
              >
                <Upload size={12} />
              </Link>
            </Show>
          </div>
          <p class="mt-1 text-sm text-muted-foreground">
            {filteredPhotos().length} photo{filteredPhotos().length !== 1 ? "s" : ""}
            <Show when={filteredPhotos().length !== allPhotos().length}>
              <span class="text-muted-foreground/60"> (filtered from {allPhotos().length})</span>
            </Show>
          </p>
        </div>
        <div class="flex items-center gap-2">
          <Button
            variant={showFilters() ? "default" : "ghost"}
            size="icon"
            class="size-8"
            onClick={() => setShowFilters(!showFilters())}
            aria-label="Toggle filters"
          >
            <SlidersHorizontal size={16} />
          </Button>
          <Segment<ViewMode> options={VIEW_OPTIONS} value={viewMode()} onChange={setViewMode} />
        </div>
      </div>

      <Show when={settings().selectedTags.length > 0}>
        <div class="mb-4">
          <ActiveFilterChips />
        </div>
      </Show>

      <Show when={showFilters()}>
        <div class="mb-6 rounded-lg border border-border bg-card p-4">
          <FilterPanel photos={allPhotos()} />
        </div>
      </Show>

      <div id="gallery-scroll-container">
        {viewMode() === "grid" ? (
          <MasonryView photos={filteredPhotos()} onPhotoClick={(i) => setViewerIndex(i)} />
        ) : (
          <ListView photos={filteredPhotos()} onPhotoClick={(i) => setViewerIndex(i)} />
        )}
      </div>

      <Show when={viewerIndex() !== null}>
        <PhotoViewer
          photos={filteredPhotos()}
          index={viewerIndex()!}
          onClose={() => setViewerIndex(null)}
          onIndexChange={(i) => setViewerIndex(i)}
        />
      </Show>
    </div>
  );
}
