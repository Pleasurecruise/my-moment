import { createMemo, createSignal, For, onCleanup, onMount, Show } from "solid-js";
import type { PhotoItem } from "~/types";
import { EmptyState } from "~/components/EmptyState";
import { MasonryPhotoItem } from "./MasonryPhotoItem";

interface MasonryViewProps {
  photos: PhotoItem[];
  onPhotoClick?: (index: number) => void;
}

export function MasonryView(props: MasonryViewProps) {
  const [columnCount, setColumnCount] = createSignal(3);
  const [isMobile, setIsMobile] = createSignal(false);
  const [containerWidth, setContainerWidth] = createSignal(0);

  const photos = () => props.photos;

  const updateColumnCount = () => {
    const w = window.innerWidth;
    setIsMobile(w < 640);
    if (w < 640) setColumnCount(1);
    else if (w < 1024) setColumnCount(2);
    else setColumnCount(3);
  };

  let containerRef: HTMLDivElement | undefined;

  const updateContainerWidth = () => {
    if (containerRef) {
      setContainerWidth(containerRef.clientWidth);
    }
  };

  onMount(() => {
    updateColumnCount();
    updateContainerWidth();
    const handleResize = () => {
      updateColumnCount();
      updateContainerWidth();
    };
    window.addEventListener("resize", handleResize);
    onCleanup(() => window.removeEventListener("resize", handleResize));
  });

  const columnWidth = createMemo(() => {
    const gutter = isMobile() ? 4 : 8;
    const width = containerWidth() || window.innerWidth - (isMobile() ? 32 : 64);
    return (width - (columnCount() - 1) * gutter) / columnCount();
  });

  const masonryItems = createMemo(() => {
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

  return (
    <Show
      when={photos().length > 0}
      fallback={
        <EmptyState
          title="No photos found"
          description="Try adjusting the filters or upload a new moment."
        />
      }
    >
      <div
        ref={(el) => {
          containerRef = el;
        }}
        class="flex gap-1 sm:gap-2 w-full overflow-hidden"
      >
        <For each={masonryItems()}>
          {(colPhotos) => (
            <div class="flex flex-1 flex-col gap-1 sm:gap-2">
              <For each={colPhotos}>
                {(photo) => (
                  <MasonryPhotoItem
                    photo={photo}
                    width={columnWidth()}
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
