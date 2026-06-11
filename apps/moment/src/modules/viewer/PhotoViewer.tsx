import { createSignal, createEffect, onCleanup, onMount, Show, For, createMemo } from "solid-js";
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
  const [highResLoaded, setHighResLoaded] = createSignal(false);

  createEffect(() => {
    const idx = props.index;
    [idx - 1, idx + 1]
      .filter((i) => i >= 0 && i < props.photos.length)
      .forEach((i) => {
        const img = new Image();
        img.src = props.photos[i].url;
      });
  });

  createEffect(() => {
    void props.index; // 触发依赖追踪
    setHighResLoaded(false);
  });

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

  const formattedDate = createMemo(() => {
    const p = photo();
    if (!p.date) return null;
    try {
      return new Date(p.date).toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return p.date;
    }
  });

  return (
    <Portal>
      <div class="fixed inset-0 z-50 flex bg-background/95 backdrop-blur-sm">
        <div class="relative flex min-h-0 min-w-0 flex-1 flex-col">
          <div class="flex items-center justify-between px-4 py-3">
            <span class="text-sm tabular-nums text-muted-foreground">
              {props.index + 1} / {props.photos.length}
            </span>
            <div class="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                class="size-8 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() => navigator.share?.({ url: photo().url, title: photo().title })}
              >
                <Share2 size={15} />
              </Button>
              <Show when={!sidebarOpen()}>
                <Button
                  variant="ghost"
                  size="icon"
                  class="size-8 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                  onClick={() => setSidebarOpen(true)}
                >
                  <PanelRightOpen size={16} />
                </Button>
              </Show>
              <Button
                variant="ghost"
                size="icon"
                class="size-8 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={props.onClose}
              >
                <X size={18} />
              </Button>
            </div>
          </div>

          <div class="flex min-h-0 flex-1 items-center justify-center px-12">
            <Show when={props.index > 0}>
              <Button
                variant="ghost"
                size="icon"
                class="absolute left-4 top-1/2 -translate-y-1/2 size-10 rounded-full bg-card/80 text-muted-foreground backdrop-blur-sm hover:bg-muted hover:text-foreground"
                onClick={goPrev}
              >
                <ChevronLeft size={22} />
              </Button>
            </Show>

            <div class="relative flex h-full w-full items-center justify-center overflow-hidden p-4">
              <img
                src={highResLoaded() ? photo().url : photo().thumbnailUrl || photo().url}
                alt={photo().title}
                class="max-h-full max-w-full object-contain transition-opacity duration-300"
                draggable={false}
                onLoad={() => {
                  if (!highResLoaded()) {
                    const img = new Image();
                    img.src = photo().url;
                    img.onload = () => setHighResLoaded(true);
                  }
                }}
              />
            </div>

            <Show when={props.index < props.photos.length - 1}>
              <Button
                variant="ghost"
                size="icon"
                class="absolute right-4 top-1/2 -translate-y-1/2 size-10 rounded-full bg-card/80 text-muted-foreground backdrop-blur-sm hover:bg-muted hover:text-foreground"
                onClick={goNext}
              >
                <ChevronRight size={22} />
              </Button>
            </Show>
          </div>
        </div>

        <div
          class="hidden shrink-0 flex-col border-l border-border bg-background/60 backdrop-blur-sm transition-all duration-300 lg:flex"
          style={{ width: sidebarOpen() ? "20rem" : "0", overflow: "hidden" }}
        >
          <div class="flex h-full w-80 flex-col">
            <div class="flex items-center justify-between border-b border-border px-4 py-3">
              <span class="text-sm text-muted-foreground">Info</span>
              <Button
                variant="ghost"
                size="icon"
                class="size-7 rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() => setSidebarOpen(false)}
              >
                <PanelRightClose size={16} />
              </Button>
            </div>

            <div class="flex-1 overflow-auto p-4">
              <div class="space-y-4">
                <h2 class="text-lg font-semibold text-foreground">{photo().title}</h2>

                <Show when={formattedDate()}>
                  <Card class="p-3">
                    <p class="text-xs text-muted-foreground/70">Date</p>
                    <p class="text-foreground">{formattedDate()}</p>
                  </Card>
                </Show>

                <Card class="grid grid-cols-2 gap-2 text-sm">
                  <div class="p-3">
                    <p class="text-xs text-muted-foreground/70">Dimensions</p>
                    <p class="text-foreground">
                      {photo().width} × {photo().height}
                    </p>
                  </div>
                  <div class="p-3">
                    <p class="text-xs text-muted-foreground/70">Format</p>
                    <p class="text-foreground">{photo().format}</p>
                  </div>
                </Card>

                <Show when={photo().size}>
                  <Card class="p-3">
                    <p class="text-xs text-muted-foreground/70">Size</p>
                    <p class="text-foreground">
                      {((photo().size ?? 0) / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </Card>
                </Show>

                <Show when={photo().tags.length > 0}>
                  <div class="flex flex-wrap gap-1.5">
                    <For each={photo().tags}>{(tag) => <Badge variant="outline">{tag}</Badge>}</For>
                  </div>
                </Show>

                <Show when={photo().description}>
                  <p class="text-sm leading-relaxed text-muted-foreground">{photo().description}</p>
                </Show>
              </div>

              <div class="mt-8 border-t border-border pt-6">
                <div class="flex items-center gap-2 text-muted-foreground">
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
                    class="text-muted-foreground/70 placeholder:text-muted-foreground/40"
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
