import { createSignal, Show, splitProps, type ComponentProps } from "solid-js";
import { createVisibilityObserver } from "@solid-primitives/intersection-observer";
import { cn } from "@my-moment/ui";
import { Thumbhash } from "./Thumbhash";

export interface LazyImageProps extends ComponentProps<"img"> {
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
    "onLoad",
    "onError",
  ]);
  const [containerRef, setContainerRef] = createSignal<HTMLDivElement>();

  const useVisibility = createVisibilityObserver({
    rootMargin: local.rootMargin ?? "200px",
    threshold: local.threshold ?? 0,
  });
  const isVisible = useVisibility(containerRef);

  const [isLoaded, setIsLoaded] = createSignal(false);
  const [hasError, setHasError] = createSignal(false);

  const handleLoad = (e: Event) => {
    setIsLoaded(true);
    local.onLoad?.(e);
  };

  const handleError = (e: Event) => {
    setHasError(true);
    local.onError?.(e);
  };

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
          onLoad={handleLoad}
          onError={handleError}
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
