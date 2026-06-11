import { createSignal, For, Show, createMemo } from "solid-js";
import { Badge, Button, Input } from "@my-moment/ui";
import { useGallerySettings } from "~/providers/gallery-settings-provider";
import type { TagFilterMode, SortOrder, DateRangeFilter } from "~/types/gallery";
import { getAllTags } from "~/types/gallery";
import type { PhotoItem } from "~/types/photo";

interface FilterPanelProps {
  photos: PhotoItem[];
}

export function FilterPanel(props: FilterPanelProps) {
  const { settings, updateSettings } = useGallerySettings();
  const [showDatePicker, setShowDatePicker] = createSignal(false);

  const allTags = createMemo(() => getAllTags(props.photos));

  const toggleTag = (tag: string) => {
    const currentTags = settings().selectedTags;
    const newTags = currentTags.includes(tag)
      ? currentTags.filter((t) => t !== tag)
      : [...currentTags, tag];
    updateSettings({ selectedTags: newTags });
  };

  const toggleTagFilterMode = () => {
    const newMode: TagFilterMode = settings().tagFilterMode === "union" ? "intersection" : "union";
    updateSettings({ tagFilterMode: newMode });
  };

  const toggleSortOrder = () => {
    const newOrder: SortOrder = settings().sortOrder === "asc" ? "desc" : "asc";
    updateSettings({ sortOrder: newOrder });
  };

  const setDateRange = (range: DateRangeFilter | null) => {
    updateSettings({ selectedDateRange: range });
  };

  const clearFilters = () => {
    updateSettings({
      selectedTags: [],
      selectedDateRange: null,
      sortOrder: "desc",
      tagFilterMode: "union",
    });
  };

  const hasActiveFilters = createMemo(() => {
    const { selectedTags, selectedDateRange } = settings();
    return selectedTags.length > 0 || selectedDateRange !== null;
  });

  return (
    <div class="space-y-4">
      <Show when={hasActiveFilters()}>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-sm text-muted-foreground">Active filters:</span>
            <Show when={settings().selectedTags.length > 0}>
              <Badge variant="secondary" class="text-xs">
                {settings().selectedTags.length} tags
              </Badge>
            </Show>
            <Show when={settings().selectedDateRange}>
              <Badge variant="secondary" class="text-xs">
                date range
              </Badge>
            </Show>
          </div>
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear all
          </Button>
        </div>
      </Show>

      <div>
        <div class="mb-2 flex items-center justify-between">
          <h4 class="text-sm font-medium">Tags</h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTagFilterMode}
            class="text-xs text-muted-foreground"
          >
            {settings().tagFilterMode === "union" ? "Any match" : "All match"}
          </Button>
        </div>
        <div class="flex flex-wrap gap-1.5">
          <For each={allTags()}>
            {(tag) => (
              <Badge
                variant={settings().selectedTags.includes(tag) ? "default" : "outline"}
                class="cursor-pointer text-xs"
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </Badge>
            )}
          </For>
        </div>
      </div>

      <div>
        <div class="mb-2 flex items-center justify-between">
          <h4 class="text-sm font-medium">Date Range</h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDatePicker(!showDatePicker())}
            class="text-xs text-muted-foreground"
          >
            {showDatePicker() ? "Hide" : "Show"}
          </Button>
        </div>
        <Show when={showDatePicker()}>
          <div class="flex gap-2">
            <div class="flex-1">
              <label class="mb-1 block text-xs text-muted-foreground">From</label>
              <Input
                type="date"
                value={settings().selectedDateRange?.from || ""}
                onChange={(e: Event) =>
                  setDateRange({
                    from: (e.target as HTMLInputElement).value,
                    to: settings().selectedDateRange?.to,
                  })
                }
              />
            </div>
            <div class="flex-1">
              <label class="mb-1 block text-xs text-muted-foreground">To</label>
              <Input
                type="date"
                value={settings().selectedDateRange?.to || ""}
                onChange={(e: Event) =>
                  setDateRange({
                    from: settings().selectedDateRange?.from,
                    to: (e.target as HTMLInputElement).value,
                  })
                }
              />
            </div>
          </div>
          <Show when={settings().selectedDateRange}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDateRange(null)}
              class="mt-2 text-xs text-muted-foreground"
            >
              Clear date range
            </Button>
          </Show>
        </Show>
      </div>

      <div>
        <h4 class="mb-2 text-sm font-medium">Sort</h4>
        <div class="flex gap-2">
          <Button
            variant={settings().sortOrder === "desc" ? "default" : "outline"}
            size="sm"
            onClick={toggleSortOrder}
          >
            Newest first
          </Button>
          <Button
            variant={settings().sortOrder === "asc" ? "default" : "outline"}
            size="sm"
            onClick={toggleSortOrder}
          >
            Oldest first
          </Button>
        </div>
      </div>
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

  const clearDateRange = () => {
    updateSettings({ selectedDateRange: null });
  };

  return (
    <Show when={settings().selectedTags.length > 0 || settings().selectedDateRange !== null}>
      <div class="flex flex-wrap items-center gap-2">
        <For each={settings().selectedTags}>
          {(tag) => (
            <Badge variant="secondary" class="gap-1 text-xs">
              {tag}
              <button onClick={() => removeTag(tag)} class="ml-1 hover:text-destructive">
                ×
              </button>
            </Badge>
          )}
        </For>
        <Show when={settings().selectedDateRange}>
          <Badge variant="secondary" class="gap-1 text-xs">
            {settings().selectedDateRange?.from || "..."} →{" "}
            {settings().selectedDateRange?.to || "..."}
            <button onClick={clearDateRange} class="ml-1 hover:text-destructive">
              ×
            </button>
          </Badge>
        </Show>
      </div>
    </Show>
  );
}
