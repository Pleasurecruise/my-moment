import { createMemo, createSignal, For, onCleanup, onMount, Show } from "solid-js";
import type { PhotoItem } from "~/types/photo";
import { MasonryPhotoItem } from "./MasonryPhotoItem";

interface MasonryViewProps {
  photos: PhotoItem[];
  onPhotoClick?: (index: number) => void;
}

export function MasonryView(props: MasonryViewProps) {
  const [columnCount, setColumnCount] = createSignal(3);

  const photos = () => props.photos;

  const columns = createMemo(() => {
    const cols: PhotoItem[][] = Array.from({ length: columnCount() }, () => []);
    const heights = Array.from({ length: columnCount() }, () => 0);

    photos().forEach((photo) => {
      const ar =
        photo.aspectRatio || (photo.width && photo.height ? photo.width / photo.height : 1);
      const normalizedH = 1 / (ar || 1);

      let shortest = 0;
      let minH = heights[0]!;
      for (let c = 1; c < columnCount(); c++) {
        if (heights[c]! < minH) {
          minH = heights[c]!;
          shortest = c;
        }
      }

      cols[shortest]!.push(photo);
      heights[shortest] = minH + normalizedH;
    });

    return cols;
  });

  const updateColumnCount = () => {
    const w = window.innerWidth;
    if (w < 640) setColumnCount(1);
    else if (w < 1024) setColumnCount(2);
    else setColumnCount(3);
  };

  onMount(() => {
    updateColumnCount();
    window.addEventListener("resize", updateColumnCount);
  });

  onCleanup(() => {
    window.removeEventListener("resize", updateColumnCount);
  });

  return (
    <Show when={photos().length > 0} fallback={<EmptyState />}>
      <div class="flex gap-1 sm:gap-2">
        <For each={columns()}>
          {(colPhotos) => (
            <div class="flex flex-1 flex-col gap-1 sm:gap-2">
              <For each={colPhotos}>
                {(photo) => (
                  <MasonryPhotoItem
                    photo={photo}
                    onClick={() => {
                      const idx = photos().indexOf(photo);
                      if (idx >= 0) props.onPhotoClick?.(idx);
                    }}
                  />
                )}
              </For>
            </div>
          )}
        </For>
      </div>
    </Show>
  );
}

function EmptyState() {
  return (
    <div class="flex flex-col items-center justify-center py-20 text-muted-foreground">
      <svg
        class="mb-4 h-12 w-12 opacity-40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="M21 15l-5-5L5 21" />
      </svg>
      <p class="text-sm">No photos yet.</p>
      <p class="mt-1 text-xs opacity-60">Upload your first moment to get started.</p>
    </div>
  );
}
