import { createSignal, Show, splitProps, type JSX } from "solid-js";
import { createVisibilityObserver } from "@solid-primitives/intersection-observer";
import { cn } from "@my-moment/ui";
import { Thumbhash } from "./Thumbhash";

export interface LazyImageProps extends JSX.ImgHTMLAttributes<HTMLImageElement> {
  thumbHash?: string | null;
  rootMargin?: string;
  threshold?: number;
}

export function LazyImage(props: LazyImageProps) {
  const [local, rest] = splitProps(props, [
    "thumbHash",
    "rootMargin",
    "threshold",
    "class",
    "style",
  ]);

  const [containerRef, setContainerRef] = createSignal<HTMLDivElement>();
  const [isLoaded, setIsLoaded] = createSignal(false);
  const [hasError, setHasError] = createSignal(false);

  const useVisibility = createVisibilityObserver({
    rootMargin: local.rootMargin ?? "200px",
    threshold: local.threshold ?? 0,
  });
  const isVisible = useVisibility(containerRef);

  return (
    <div
      ref={setContainerRef}
      class={cn("relative overflow-hidden", local.class)}
      style={local.style}
    >
      <Show when={local.thumbHash && !isLoaded()}>
        <Thumbhash thumbHash={local.thumbHash!} class="absolute inset-0 scale-110 blur-sm" />
      </Show>

      <Show when={isVisible() && !hasError()}>
        <img
          {...rest}
          class={cn(
            "h-full w-full object-cover transition-opacity duration-300",
            isLoaded() ? "opacity-100" : "opacity-0",
          )}
          loading="lazy"
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
        />
      </Show>

      <Show when={hasError()}>
        <div class="absolute inset-0 flex items-center justify-center bg-muted">
          <span class="text-sm text-muted-foreground">Failed to load image</span>
        </div>
      </Show>
    </div>
  );
}
