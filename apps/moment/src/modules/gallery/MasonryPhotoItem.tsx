import { createSignal, Show } from "solid-js";
import { Badge } from "@my-moment/ui";
import { Thumbhash } from "~/components/Thumbhash";
import type { PhotoItem } from "~/types/photo";

interface MasonryPhotoItemProps {
  photo: PhotoItem;
  onClick?: () => void;
}

export function MasonryPhotoItem(props: MasonryPhotoItemProps) {
  const photo = () => props.photo;

  const [imageLoaded, setImageLoaded] = createSignal(false);
  const [imageError, setImageError] = createSignal(false);

  const ratio = () => {
    const ar =
      photo().aspectRatio || (photo().width && photo().height ? photo().width / photo().height : 0);
    return ar || 1;
  };

  return (
    <button
      type="button"
      class="group relative w-full cursor-pointer overflow-hidden bg-muted text-left"
      style={{ "padding-top": `${100 / ratio()}%` }}
      onClick={() => props.onClick?.()}
    >
      {/* Thumbhash placeholder */}
      <Show when={photo().thumbHash}>
        <Thumbhash thumbHash={photo().thumbHash!} class="absolute inset-0" />
      </Show>

      {/* Thumbnail image */}
      <Show when={!imageError()}>
        <img
          src={photo().thumbnailUrl}
          alt={photo().title}
          class="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
        />
      </Show>

      {/* Error state */}
      <Show when={imageError()}>
        <div class="absolute inset-0 flex items-center justify-center bg-muted">
          <span class="text-xs text-muted-foreground">Failed to load</span>
        </div>
      </Show>

      {/* Hover overlay (only when image is loaded) */}
      <Show when={imageLoaded()}>
        <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Content on hover */}
        <div class="pointer-events-none absolute inset-x-0 bottom-0 p-3 text-white">
          <h3 class="truncate text-sm font-medium opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            {photo().title}
          </h3>

          <Show when={photo().description}>
            <p class="mt-1 line-clamp-2 text-xs text-white/75 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              {photo().description}
            </p>
          </Show>

          <div class="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-white/70 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <span>
              {photo().width} × {photo().height}
            </span>
            <Show when={photo().size}>
              <span>•</span>
              <span>{(photo().size! / 1024 / 1024).toFixed(1)} MB</span>
            </Show>
          </div>

          {/* Tags */}
          <Show when={photo().tags.length > 0}>
            <div class="mt-2 flex flex-wrap gap-1 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              {photo().tags.map((tag) => (
                <Badge
                  variant="secondary"
                  class="bg-white/20 text-white/90 backdrop-blur-sm text-[10px] px-2 py-0.5"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </Show>
        </div>
      </Show>
    </button>
  );
}
