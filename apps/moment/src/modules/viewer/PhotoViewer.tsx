import { createSignal, createEffect, onCleanup, onMount, Show } from "solid-js";
import { Portal } from "solid-js/web";
import {
  ChevronLeft,
  ChevronRight,
  X,
  PanelRightOpen,
  PanelRightClose,
  Share2,
  Edit3,
  Trash2,
} from "lucide-solid";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Spinner,
  toast,
} from "@my-moment/ui";
import { shareLink } from "~/lib/share";
import type { PhotoItem } from "~/types";
import { PhotoDetails } from "./PhotoDetails";

interface PhotoViewerProps {
  photos: PhotoItem[];
  index: number;
  onClose: () => void;
  onIndexChange: (i: number) => void;
  onEdit: (photo: PhotoItem) => void;
  onDeleted: (photo: PhotoItem) => void;
}

export function PhotoViewer(props: PhotoViewerProps) {
  const photo = () => props.photos[props.index];
  const [sidebarOpen, setSidebarOpen] = createSignal(true);
  const [highResLoaded, setHighResLoaded] = createSignal(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = createSignal(false);
  const [deleting, setDeleting] = createSignal(false);

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
    void props.index; // Trigger dependency tracking
    setHighResLoaded(false);
  });

  const goPrev = () => {
    if (props.index > 0) props.onIndexChange(props.index - 1);
  };
  const goNext = () => {
    if (props.index < props.photos.length - 1) props.onIndexChange(props.index + 1);
  };

  const deletePhoto = async () => {
    if (deleting()) return;

    const currentPhoto = photo();
    setDeleting(true);
    try {
      const response = await fetch(`/api/photos/${currentPhoto.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete photo");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete photo");
      setDeleting(false);
      return;
    }

    setDeleting(false);
    setDeleteDialogOpen(false);
    toast.success("Photo deleted");
    props.onDeleted(currentPhoto);
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
                onClick={() =>
                  void shareLink({
                    url: `${window.location.origin}/photos/${photo().id}`,
                    title: photo().title,
                  })
                }
              >
                <Share2 size={15} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                class="size-8 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() => props.onEdit(photo())}
              >
                <Edit3 size={15} />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                class="size-8 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setDeleteDialogOpen(true)}
                aria-label="Delete photo"
                title="Delete photo"
              >
                <Trash2 size={15} />
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
          <details class="group max-h-[42dvh] shrink-0 overflow-auto border-t border-border bg-background/92 lg:hidden">
            <summary class="sticky top-0 flex cursor-pointer list-none items-center justify-between bg-background/95 px-4 py-3 text-sm font-medium backdrop-blur-sm">
              Photo details
              <span class="text-xs font-normal text-muted-foreground group-open:hidden">Open</span>
              <span class="hidden text-xs font-normal text-muted-foreground group-open:inline">
                Close
              </span>
            </summary>
            <PhotoDetails photo={photo()} class="px-4 pb-5" />
          </details>
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
              <PhotoDetails photo={photo()} />
            </div>
          </div>
        </div>

        <AlertDialog
          open={deleteDialogOpen()}
          onOpenChange={(open) => {
            if (!deleting()) setDeleteDialogOpen(open);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this photo?</AlertDialogTitle>
              <AlertDialogDescription>
                “{photo().title}” and its thumbnail will be permanently removed, together with all
                stored metadata. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel as={Button} variant="outline" disabled={deleting()}>
                Cancel
              </AlertDialogCancel>
              <Button
                variant="destructive"
                disabled={deleting()}
                onClick={() => void deletePhoto()}
              >
                <Show
                  when={!deleting()}
                  fallback={
                    <>
                      <Spinner size="sm" /> Deleting…
                    </>
                  }
                >
                  <Trash2 size={14} />
                  Delete photo
                </Show>
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Portal>
  );
}
