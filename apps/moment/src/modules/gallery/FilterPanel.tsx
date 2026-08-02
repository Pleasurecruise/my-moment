import { For, Show, createMemo } from "solid-js";
import { Check, RotateCcw } from "lucide-solid";
import { Tag, cn } from "@my-moment/ui";
import { useGallerySettings } from "~/providers/gallery-settings-provider";
import { getAllTags } from "~/types/gallery";
import type { PhotoItem } from "~/types";

interface FilterPanelProps {
  photos: PhotoItem[];
}

export function FilterPanel(props: FilterPanelProps) {
  const { settings, updateSettings } = useGallerySettings();
  const allTags = createMemo(() => getAllTags(props.photos));

  const toggleTag = (tag: string) => {
    const currentTags = settings().selectedTags;
    const newTags = currentTags.includes(tag)
      ? currentTags.filter((t) => t !== tag)
      : [...currentTags, tag];
    updateSettings({ selectedTags: newTags });
  };

  const clearFilters = () => {
    updateSettings({
      selectedTags: [],
      sortOrder: "desc",
      tagFilterMode: "union",
    });
  };

  const hasChanges = () =>
    settings().selectedTags.length > 0 ||
    settings().sortOrder !== "desc" ||
    settings().tagFilterMode !== "union";

  return (
    <div class="space-y-4">
      <div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-8">
        <section class="min-w-0" aria-labelledby="gallery-tags-label">
          <div class="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h4
                id="gallery-tags-label"
                class="font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground"
              >
                Filter by tag
              </h4>
              <p class="mt-1 text-xs text-muted-foreground/70">{allTags().length} available</p>
            </div>

            <div
              role="group"
              class="inline-flex rounded-md border border-border/80 bg-background/50 p-0.5"
              aria-label="Tag matching mode"
            >
              <button
                type="button"
                onClick={() => updateSettings({ tagFilterMode: "union" })}
                aria-pressed={settings().tagFilterMode === "union"}
                class={cn(
                  "rounded px-2.5 py-1 text-[11px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  settings().tagFilterMode === "union"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                Any
              </button>
              <button
                type="button"
                onClick={() => updateSettings({ tagFilterMode: "intersection" })}
                aria-pressed={settings().tagFilterMode === "intersection"}
                class={cn(
                  "rounded px-2.5 py-1 text-[11px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  settings().tagFilterMode === "intersection"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                All
              </button>
            </div>
          </div>

          <Show
            when={allTags().length > 0}
            fallback={<p class="py-2 text-sm text-muted-foreground">No tags yet.</p>}
          >
            <div class="flex flex-wrap gap-1.5">
              <For each={allTags()}>
                {(tag) => {
                  const selected = () => settings().selectedTags.includes(tag);
                  return (
                    <button
                      type="button"
                      onClick={() => toggleTag(tag)}
                      aria-pressed={selected()}
                      class={cn(
                        "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        selected()
                          ? "border-foreground bg-foreground text-background shadow-sm"
                          : "border-border/80 bg-background/40 text-muted-foreground hover:border-foreground/25 hover:bg-muted hover:text-foreground",
                      )}
                    >
                      {tag}
                      <Show when={selected()}>
                        <Check size={11} aria-hidden="true" />
                      </Show>
                    </button>
                  );
                }}
              </For>
            </div>
          </Show>
        </section>

        <section
          class="border-t border-border/70 pt-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0"
          aria-labelledby="gallery-sort-label"
        >
          <h4
            id="gallery-sort-label"
            class="font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground"
          >
            Order by date
          </h4>
          <div class="mt-3 grid grid-cols-2 rounded-md border border-border/80 bg-background/50 p-1">
            <button
              type="button"
              onClick={() => updateSettings({ sortOrder: "desc" })}
              aria-pressed={settings().sortOrder === "desc"}
              class={cn(
                "rounded px-3 py-2 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                settings().sortOrder === "desc"
                  ? "bg-muted font-medium text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Newest
            </button>
            <button
              type="button"
              onClick={() => updateSettings({ sortOrder: "asc" })}
              aria-pressed={settings().sortOrder === "asc"}
              class={cn(
                "rounded px-3 py-2 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                settings().sortOrder === "asc"
                  ? "bg-muted font-medium text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Oldest
            </button>
          </div>
          <p class="mt-2 text-[11px] leading-4 text-muted-foreground/70">
            Photos without a date appear at the end.
          </p>
        </section>
      </div>

      <Show when={hasChanges()}>
        <div class="flex items-center justify-between gap-3 border-t border-border/70 pt-3">
          <p class="text-xs text-muted-foreground">
            {settings().selectedTags.length} tag
            {settings().selectedTags.length === 1 ? "" : "s"} selected
          </p>
          <button
            type="button"
            onClick={clearFilters}
            class="inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <RotateCcw size={11} aria-hidden="true" />
            Reset
          </button>
        </div>
      </Show>
    </div>
  );
}

export function ActiveFilterChips() {
  const { settings, updateSettings } = useGallerySettings();

  const removeTag = (tag: string) => {
    updateSettings({
      selectedTags: settings().selectedTags.filter((t) => t !== tag),
    });
  };

  return (
    <Show when={settings().selectedTags.length > 0}>
      <div class="flex flex-wrap items-center gap-2">
        <For each={settings().selectedTags}>
          {(tag) => (
            <Tag variant="secondary" removable onRemove={() => removeTag(tag)}>
              {tag}
            </Tag>
          )}
        </For>
      </div>
    </Show>
  );
}
