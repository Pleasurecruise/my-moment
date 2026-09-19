import { For, Show, createMemo } from "solid-js";
import { Clapperboard, Film } from "lucide-solid";
import { EmptyState } from "~/components/EmptyState";
import type { MediaItem } from "~/types";

interface PosterGridProps {
  items: MediaItem[];
  kind: "anime" | "film";
}

export function PosterGrid(props: PosterGridProps) {
  const groups = createMemo(() => {
    const map = new Map<string, MediaItem[]>();
    for (const item of props.items) {
      const year = (item.date ?? "").slice(0, 4) || "Others";
      const list = map.get(year) ?? [];
      list.push(item);
      map.set(year, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) => {
      if (a === "Others") return 1;
      if (b === "Others") return -1;
      return Number(b) - Number(a);
    });
  });

  return (
    <Show
      when={props.items.length > 0}
      fallback={
        <EmptyState title="Nothing here yet" description="This corner is still being set up." />
      }
    >
      <div class="space-y-8">
        <For each={groups()}>
          {([year, items]) => (
            <section>
              <h2 class="mb-4 text-2xl font-bold tracking-tight text-muted-foreground/70">
                {year}
              </h2>
              <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                <For each={items}>
                  {(item) => (
                    <div class="group flex flex-col">
                      <div class="relative aspect-[2/3] overflow-hidden rounded-lg bg-muted shadow-sm transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-lg">
                        <Show
                          when={item.imageUrl}
                          fallback={
                            <div class="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/50 text-muted-foreground">
                              {props.kind === "film" ? (
                                <Film size={30} strokeWidth={1.25} aria-hidden="true" />
                              ) : (
                                <Clapperboard size={30} strokeWidth={1.25} aria-hidden="true" />
                              )}
                            </div>
                          }
                        >
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            class="h-full w-full object-cover"
                            loading="lazy"
                          />
                        </Show>
                      </div>

                      <div class="mt-2 flex flex-col items-center gap-0.5 text-center">
                        <span class="text-sm font-medium leading-snug text-foreground">
                          {item.title}
                        </span>
                        <Show when={item.date}>
                          <span class="text-xs text-muted-foreground">{item.date}</span>
                        </Show>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </section>
          )}
        </For>
      </div>
    </Show>
  );
}
