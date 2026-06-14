import { Show } from "solid-js";
import { Badge } from "@my-moment/ui";
import { LazyImage } from "~/components/LazyImage";
import { useGallerySettings } from "~/providers/gallery-settings-provider";
import type { PhotoItem } from "~//types/photo";

interface MasonryPhotoItemProps {
  photo: PhotoItem;
  width?: number;
  onClick?: () => void;
}

export function MasonryPhotoItem(props: MasonryPhotoItemProps) {
  const photo = () => props.photo;
  const { settings, updateSettings } = useGallerySettings();

  const toggleTag = (tag: string) => {
    const currentTags = settings().selectedTags;
    const newTags = currentTags.includes(tag)
      ? currentTags.filter((t) => t !== tag)
      : [...currentTags, tag];
    updateSettings({ selectedTags: newTags });
  };

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
      <LazyImage
        src={photo().thumbnailUrl}
        alt={photo().title}
        thumbHash={photo().thumbHash ?? null}
        class="absolute inset-0 h-full w-full object-cover duration-300 group-hover:scale-105"
        rootMargin="400px"
      />

      <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div class="pointer-events-none absolute inset-x-0 bottom-0 p-3 text-white">
        <div class="duration-300">
          <h3 class="mb-1 truncate text-sm font-medium opacity-0 group-hover:opacity-100">
            {photo().title}
          </h3>

          <Show when={photo().description}>
            <p class="mb-1 line-clamp-2 text-xs text-white/75 opacity-0 group-hover:opacity-100">
              {photo().description}
            </p>
          </Show>

          <div class="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-white/70 opacity-0 group-hover:opacity-100">
            <span>
              {photo().width} × {photo().height}
            </span>
            <Show when={photo().size}>
              <span>•</span>
              <span>{((photo().size ?? 0) / 1024 / 1024).toFixed(1)} MB</span>
            </Show>
          </div>

          <Show when={photo().tags.length > 0}>
            <div class="mt-2 flex flex-wrap gap-1 opacity-0 group-hover:opacity-100">
              {photo().tags.map((tag) => (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTag(tag);
                  }}
                >
                  <Badge
                    variant="secondary"
                    class="bg-white/20 text-white/90 backdrop-blur-sm text-[10px] px-2 py-0.5 cursor-pointer hover:bg-white/30"
                  >
                    {tag}
                  </Badge>
                </button>
              ))}
            </div>
          </Show>
        </div>
      </div>
    </button>
  );
}
