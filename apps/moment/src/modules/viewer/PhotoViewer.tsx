import { createSignal, onCleanup, onMount, Show, For } from "solid-js";
import { Portal } from "solid-js/web";
import {
  ChevronLeft,
  ChevronRight,
  X,
  MessageCircle,
  PanelRightOpen,
  PanelRightClose,
  Share2,
} from "lucide-solid";
import { Card, Badge, Button, Input, Skeleton } from "@my-moment/ui";
import type { PhotoItem } from "~/types/photo";

interface PhotoViewerProps {
  photos: PhotoItem[];
  index: number;
  onClose: () => void;
  onIndexChange: (i: number) => void;
}

export function PhotoViewer(props: PhotoViewerProps) {
  const photo = () => props.photos[props.index];
  const [sidebarOpen, setSidebarOpen] = createSignal(true);

  const goPrev = () => {
    if (props.index > 0) props.onIndexChange(props.index - 1);
  };
  const goNext = () => {
    if (props.index < props.photos.length - 1) props.onIndexChange(props.index + 1);
  };

  onMount(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") props.onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    onCleanup(() => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    });
  });

  return (
    <Portal>
      <div class="fixed inset-0 z-50 flex bg-black/95">
        {/* ── Image area ── */}
        <div class="relative flex min-h-0 min-w-0 flex-1 flex-col">
          {/* toolbar */}
          <div class="flex items-center justify-between px-4 py-3">
            <span class="text-sm text-white/60 tabular-nums">
              {props.index + 1} / {props.photos.length}
            </span>
            <div class="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                class="size-8 rounded-full text-white/70 hover:bg-white/10 hover:text-white"
                onClick={() => navigator.share?.({ url: photo().url, title: photo().title })}
              >
                <Share2 size={15} />
              </Button>
              <Show when={!sidebarOpen()}>
                <Button
                  variant="ghost"
                  size="icon"
                  class="size-8 rounded-full text-white/70 hover:bg-white/10 hover:text-white"
                  onClick={() => setSidebarOpen(true)}
                >
                  <PanelRightOpen size={16} />
                </Button>
              </Show>
              <Button
                variant="ghost"
                size="icon"
                class="size-8 rounded-full text-white/70 hover:bg-white/10 hover:text-white"
                onClick={props.onClose}
              >
                <X size={18} />
              </Button>
            </div>
          </div>

          {/* image */}
          <div class="flex min-h-0 flex-1 items-center justify-center px-12">
            <Show when={props.index > 0}>
              <Button
                variant="ghost"
                size="icon"
                class="absolute left-4 top-1/2 -translate-y-1/2 size-10 rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                onClick={goPrev}
              >
                <ChevronLeft size={22} />
              </Button>
            </Show>
            <img
              src={photo().url}
              alt={photo().title}
              class="max-h-full max-w-full object-contain"
              draggable={false}
            />
            <Show when={props.index < props.photos.length - 1}>
              <Button
                variant="ghost"
                size="icon"
                class="absolute right-4 top-1/2 -translate-y-1/2 size-10 rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                onClick={goNext}
              >
                <ChevronRight size={22} />
              </Button>
            </Show>
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div
          class="hidden shrink-0 flex-col border-l border-white/10 bg-black/60 transition-all duration-300 lg:flex"
          style={{ width: sidebarOpen() ? "20rem" : "0", overflow: "hidden" }}
        >
          <div class="flex h-full w-80 flex-col">
            <div class="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <span class="text-sm text-white/60">Info</span>
              <Button
                variant="ghost"
                size="icon"
                class="size-7 rounded text-white/50 hover:bg-white/10 hover:text-white"
                onClick={() => setSidebarOpen(false)}
              >
                <PanelRightClose size={16} />
              </Button>
            </div>

            <div class="flex-1 overflow-auto p-4">
              <div class="space-y-4">
                <h2 class="text-lg font-semibold text-white">{photo().title}</h2>

                <Card class="grid grid-cols-2 gap-2 bg-white/5 border-white/10 text-sm">
                  <div class="p-3">
                    <p class="text-white/40 text-xs">Dimensions</p>
                    <p class="text-white/90">
                      {photo().width} × {photo().height}
                    </p>
                  </div>
                  <div class="p-3">
                    <p class="text-white/40 text-xs">Format</p>
                    <p class="text-white/90">{photo().format}</p>
                  </div>
                </Card>

                <Show when={photo().size}>
                  <Card class="bg-white/5 border-white/10 p-3">
                    <p class="text-white/40 text-xs">Size</p>
                    <p class="text-white/90">{((photo().size ?? 0) / 1024 / 1024).toFixed(1)} MB</p>
                  </Card>
                </Show>

                <Show when={photo().tags.length > 0}>
                  <div class="flex flex-wrap gap-1.5">
                    <For each={photo().tags}>
                      {(tag) => (
                        <Badge variant="outline" class="border-white/10 text-white/70">
                          {tag}
                        </Badge>
                      )}
                    </For>
                  </div>
                </Show>

                <Show when={photo().description}>
                  <p class="text-sm text-white/60 leading-relaxed">{photo().description}</p>
                </Show>
              </div>

              {/* Comments placeholder */}
              <div class="mt-8 border-t border-white/10 pt-6">
                <div class="flex items-center gap-2 text-white/50">
                  <MessageCircle size={16} />
                  <span class="text-sm">Comments</span>
                </div>
                <div class="mt-3 space-y-3">
                  <div class="flex gap-3">
                    <Skeleton class="size-7 rounded-full" />
                    <div class="flex-1 space-y-1.5">
                      <Skeleton class="h-3 w-16" />
                      <Skeleton class="h-3 w-full" />
                      <Skeleton class="h-3 w-3/4" />
                    </div>
                  </div>
                  <div class="flex gap-3">
                    <Skeleton class="size-7 rounded-full" />
                    <div class="flex-1 space-y-1.5">
                      <Skeleton class="h-3 w-12" />
                      <Skeleton class="h-3 w-5/6" />
                    </div>
                  </div>
                </div>
                <div class="mt-4">
                  <Input
                    disabled
                    placeholder="Sign in to comment"
                    class="border-white/10 bg-white/5 text-white/30 placeholder:text-white/20"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}
