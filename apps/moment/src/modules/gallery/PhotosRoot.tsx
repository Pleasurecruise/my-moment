import { createSignal, Show } from "solid-js";
import { Link, useNavigate } from "@tanstack/solid-router";
import { Share2, SlidersHorizontal, Upload } from "lucide-solid";
import { Segment } from "~/components/Segment";
import { PageHeader } from "~/components/PageHeader";
import { Button, Spinner } from "@my-moment/ui";
import { shareLink } from "~/lib/share";
import { MasonryView } from "./MasonryView";
import { ListView } from "./ListView";
import { FilterPanel, ActiveFilterChips } from "./FilterPanel";
import { PhotoViewer } from "~/modules/viewer/PhotoViewer";
import type { PhotoItem, TagCount } from "~/types";
import { useGallerySettings } from "~/providers/gallery-settings-provider";

type ViewMode = "grid" | "list";

const VIEW_OPTIONS = [
  { value: "grid" as const, label: "Grid" },
  { value: "list" as const, label: "List" },
];

interface PhotosRootProps {
  /** Loaded pages, already filtered and ordered by the server. */
  photos: PhotoItem[];
  tags: TagCount[];
  total: number;
  canUpload: boolean;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  loadMoreRef: (element: HTMLDivElement) => void;
}

export function PhotosRoot(props: PhotosRootProps) {
  const { settings } = useGallerySettings();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = createSignal<ViewMode>("grid");
  const [viewerIndex, setViewerIndex] = createSignal<number | null>(null);
  const [showFilters, setShowFilters] = createSignal(false);
  const [deletedPhotoIds, setDeletedPhotoIds] = createSignal(new Set<string>());

  const photos = () => props.photos.filter((photo) => !deletedPhotoIds().has(photo.id));
  const filtered = () => settings().selectedTags.length > 0;

  const shareGalleryLink = () =>
    void shareLink({ url: `${window.location.origin}/`, title: "Gallery" });

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
          <Show
            when={filtered()}
            fallback={
              <>
                {props.total} photo{props.total !== 1 ? "s" : ""}
              </>
            }
          >
            {photos().length}
            {props.hasMore ? "+" : ""} matching
            <span class="text-muted-foreground/60"> (of {props.total})</span>
          </Show>
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
          <FilterPanel tags={props.tags} />
        </div>
      </Show>

      <div id="gallery-scroll-container">
        {viewMode() === "grid" ? (
          <MasonryView photos={photos()} onPhotoClick={(i) => setViewerIndex(i)} />
        ) : (
          <ListView photos={photos()} onPhotoClick={(i) => setViewerIndex(i)} />
        )}
      </div>

      <Show when={props.hasMore}>
        <div ref={props.loadMoreRef} class="mt-8 flex justify-center">
          <Button variant="outline" disabled={props.loadingMore} onClick={props.onLoadMore}>
            <Show when={!props.loadingMore} fallback={<Spinner size="sm" />}>
              Load more
            </Show>
          </Button>
        </div>
      </Show>

      <Show when={viewerIndex() !== null}>
        <PhotoViewer
          photos={photos()}
          index={viewerIndex()!}
          onClose={() => setViewerIndex(null)}
          onIndexChange={(i) => {
            setViewerIndex(i);
            // Fetch the next page before the viewer reaches the last loaded photo.
            if (props.hasMore && i >= photos().length - 2) props.onLoadMore();
          }}
          onEdit={(photo) => {
            setViewerIndex(null);
            navigate({ to: `/photos/${photo.id}/edit` });
          }}
          onDeleted={(photo) => {
            setViewerIndex(null);
            setDeletedPhotoIds((current) => new Set(current).add(photo.id));
          }}
        />
      </Show>
    </main>
  );
}
