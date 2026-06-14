import { For, Show, createMemo } from "solid-js";
import { Badge, Button, Tag } from "@my-moment/ui";
import { useGallerySettings } from "~/providers/gallery-settings-provider";
import type { TagFilterMode, SortOrder } from "~/types/gallery";
import { getAllTags } from "~/types/gallery";
import type { PhotoItem } from "~/types/photo";

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

  const toggleTagFilterMode = () => {
    const newMode: TagFilterMode = settings().tagFilterMode === "union" ? "intersection" : "union";
    updateSettings({ tagFilterMode: newMode });
  };

  const toggleSortOrder = () => {
    const newOrder: SortOrder = settings().sortOrder === "asc" ? "desc" : "asc";
    updateSettings({ sortOrder: newOrder });
  };

  const clearFilters = () => {
    updateSettings({
      selectedTags: [],
      sortOrder: "desc",
      tagFilterMode: "union",
    });
  };

  return (
    <div class="space-y-4">
      <Show when={settings().selectedTags.length > 0}>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-sm text-muted-foreground">Active filters:</span>
            <Badge variant="secondary" class="text-xs">
              {settings().selectedTags.length} tags
            </Badge>
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
