import { createSignal, createMemo, Show } from "solid-js";
import { Link, useNavigate } from "@tanstack/solid-router";
import { Share2, SlidersHorizontal, Upload } from "lucide-solid";
import { Segment } from "~/components/Segment";
import { PageHeader } from "~/components/PageHeader";
import { Button } from "@my-moment/ui";
import { shareLink } from "~/lib/share";
import { MasonryView } from "./MasonryView";
import { ListView } from "./ListView";
import { FilterPanel, ActiveFilterChips } from "./FilterPanel";
import { PhotoViewer } from "~/modules/viewer/PhotoViewer";
import type { PhotoItem } from "~/types";
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
  const navigate = useNavigate();
  const [viewMode, setViewMode] = createSignal<ViewMode>("grid");
  const [viewerIndex, setViewerIndex] = createSignal<number | null>(null);
  const [showFilters, setShowFilters] = createSignal(false);

  const allPhotos = () => props.photos;

  const shareGalleryLink = () =>
    void shareLink({ url: `${window.location.origin}/`, title: "Gallery" });

  const filteredPhotos = createMemo(() => {
    const { selectedTags, sortOrder, tagFilterMode } = settings();
    return filterAndSortPhotos(allPhotos(), selectedTags, sortOrder, tagFilterMode);
  });

  return (
    <main class="pb-10">
      <PageHeader
        title="Gallery"
        actions={
          <>
            <button
              onClick={shareGalleryLink}
              class="flex size-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Share gallery"
            >
              <Share2 size={11} />
            </button>
            <Show when={props.canUpload}>
              <Link
                to="/upload"
                class="flex size-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Upload photos"
              >
                <Upload size={12} />
              </Link>
            </Show>
          </>
        }
        subtitle={
          <>
            {filteredPhotos().length} photo{filteredPhotos().length !== 1 ? "s" : ""}
            <Show when={filteredPhotos().length !== allPhotos().length}>
              <span class="text-muted-foreground/60"> (filtered from {allPhotos().length})</span>
            </Show>
          </>
        }
        controls={
          <>
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
          </>
        }
      />

      <Show when={settings().selectedTags.length > 0}>
        <div class="mb-4">
          <ActiveFilterChips />
        </div>
      </Show>

      <Show when={showFilters()}>
        <div class="mb-6 border-y border-border/70 py-4">
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
          onEdit={(photo) => {
            setViewerIndex(null);
            navigate({ to: `/photos/${photo.id}/edit` });
          }}
        />
      </Show>
    </main>
  );
}
