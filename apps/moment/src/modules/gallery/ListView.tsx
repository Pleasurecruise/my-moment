import { createVirtualizer } from "@tanstack/solid-virtual";
import { For, Show, createMemo, createSignal } from "solid-js";
import { Card, Badge } from "@my-moment/ui";
import type { PhotoItem } from "~/types/photo";

interface ListViewProps {
  photos: PhotoItem[];
  onPhotoClick?: (index: number) => void;
}

export function ListView(props: ListViewProps) {
  const photos = () => props.photos;

  const gap = 8;
  const desktopHeight = 176 + gap;

  const virtualizer = createVirtualizer({
    count: photos().length,
    getScrollElement: () => document.getElementById("gallery-scroll-container"),
    estimateSize: () => desktopHeight,
    overscan: 5,
  });

  const totalSize = createMemo(() => virtualizer.getTotalSize());

  return (
    <Show
      when={photos().length > 0}
      fallback={<div class="py-20 text-center text-sm text-muted-foreground">No photos found.</div>}
    >
      <div class="relative" style={{ height: `${totalSize()}px`, width: "100%" }}>
        <For each={virtualizer.getVirtualItems()}>
          {(virtualItem) => {
            const photo = () => photos()[virtualItem.index]!;
            const isLast = () => virtualItem.index === photos().length - 1;

            return (
              <div
                data-index={virtualItem.index}
                ref={(el) => {
                  if (el) virtualizer.measureElement(el);
                }}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualItem.start}px)`,
                  "padding-bottom": isLast() ? "0px" : `${gap}px`,
                }}
              >
                <PhotoCard
                  photo={photo()}
                  onClick={() => props.onPhotoClick?.(virtualItem.index)}
                />
              </div>
            );
          }}
        </For>
      </div>
    </Show>
  );
}

function PhotoCard(props: { photo: PhotoItem; onClick?: () => void }) {
  const photo = () => props.photo;
  const [imageError, setImageError] = createSignal(false);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Card
      class="group flex flex-col gap-2 p-3 backdrop-blur-sm transition-colors hover:border-border/80 sm:h-44 sm:flex-row sm:gap-3"
      role="button"
      tabIndex={0}
      onClick={() => props.onClick?.()}
    >
      <div class="relative w-full shrink-0 overflow-hidden rounded sm:h-full sm:w-56">
        <Show
          when={!imageError()}
          fallback={
            <div class="flex h-full w-full items-center justify-center bg-muted text-xs text-muted-foreground">
              No preview
            </div>
          }
        >
          <img
            src={photo().thumbnailUrl}
            alt={photo().title}
            class="h-auto w-full object-cover transition-transform duration-300 group-hover:scale-105 sm:h-full sm:w-full"
            style={{ "aspect-ratio": photo().aspectRatio ? `${photo().aspectRatio}` : undefined }}
            loading="lazy"
            onError={() => setImageError(true)}
          />
        </Show>

        <Show when={photo().tags.length > 0}>
          <div class="pointer-events-none absolute inset-x-0 bottom-0 flex flex-wrap gap-1 p-2">
            <For each={photo().tags.slice(0, 5)}>
              {(tag) => (
                <Badge
                  variant="secondary"
                  class="bg-black/40 text-white/90 backdrop-blur-sm text-[10px] px-1.5 py-0.5"
                >
                  {tag}
                </Badge>
              )}
            </For>
          </div>
        </Show>
      </div>

      <div class="flex min-w-0 flex-1 flex-col overflow-hidden py-0.5">
        <h3 class="mb-1 text-sm font-medium text-foreground sm:text-base">{photo().title}</h3>

        <Show when={photo().description}>
          <p class="mb-2 line-clamp-2 text-xs text-muted-foreground">{photo().description}</p>
        </Show>

        <div class="mt-auto space-y-1 text-[11px] text-muted-foreground">
          <Show when={photo().date}>
            <span>{formatDate(photo().date)}</span>
          </Show>
          <div class="flex items-center gap-2">
            <span>
              {photo().width} × {photo().height}
            </span>
            <Show when={photo().size}>
              <span>•</span>
              <span>{(photo().size! / 1024 / 1024).toFixed(1)} MB</span>
            </Show>
          </div>
        </div>
      </div>
    </Card>
  );
}
