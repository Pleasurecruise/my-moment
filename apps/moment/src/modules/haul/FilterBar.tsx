import { Show, For, createSignal } from "solid-js";
import { Button, Badge, Input, Tag, cn } from "@my-moment/ui";
import {
  Search,
  SlidersHorizontal,
  Grid3X3,
  List,
  X,
  RotateCcw,
  Clock,
  ArrowUpAZ,
  ArrowDownAZ,
  Star,
} from "lucide-solid";
import {
  CATEGORY_CONFIG,
  RATING_CONFIG,
  type Category,
  type FilterState,
  type Rating,
  type ViewMode,
} from "./types";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest", icon: Clock },
  { value: "price-asc", label: "Price Low", icon: ArrowUpAZ },
  { value: "price-desc", label: "Price High", icon: ArrowDownAZ },
  { value: "rating", label: "Top Rated", icon: Star },
] as const;

interface FilterBarProps {
  store: {
    filter: () => FilterState;
    viewMode: () => ViewMode;
    updateFilter: (partial: Partial<FilterState>) => void;
    resetFilter: () => void;
    updateViewMode: (mode: ViewMode) => void;
  };
}

export function FilterBar(props: FilterBarProps) {
  const [expanded, setExpanded] = createSignal(false);

  const hasActiveFilters = () =>
    props.store.filter().search ||
    props.store.filter().categories.length > 0 ||
    props.store.filter().ratings.length > 0 ||
    props.store.filter().sortBy !== "newest";

  const toggleCategory = (cat: Category) => {
    const current = props.store.filter().categories;
    const next = current.includes(cat) ? current.filter((c) => c !== cat) : [...current, cat];
    props.store.updateFilter({ categories: next });
  };

  const toggleRating = (rating: Rating) => {
    const current = props.store.filter().ratings;
    const next = current.includes(rating)
      ? current.filter((r) => r !== rating)
      : [...current, rating];
    props.store.updateFilter({ ratings: next });
  };

  return (
    <div class="space-y-3">
      <div class="flex items-center gap-2">
        <div class="relative flex-1">
          <Search
            size={16}
            class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <Input
            type="text"
            value={props.store.filter().search}
            onInput={(e) => props.store.updateFilter({ search: e.currentTarget.value })}
            placeholder="Search items, brands, tags..."
            class="pl-9 pr-9"
          />
          <Show when={props.store.filter().search}>
            <button
              type="button"
              onClick={() => props.store.updateFilter({ search: "" })}
              class="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          </Show>
        </div>

        <Button
          variant={expanded() ? "default" : "outline"}
          size="icon"
          onClick={() => setExpanded(!expanded())}
          class={cn(
            "shrink-0 relative",
            hasActiveFilters() && !expanded() && "ring-2 ring-primary/20",
          )}
          title="Filter"
        >
          <SlidersHorizontal size={16} />
          <Show when={hasActiveFilters() && !expanded()}>
            <span class="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full" />
          </Show>
        </Button>

        <div class="shrink-0 flex items-center bg-muted rounded-md p-0.5 border border-border">
          <button
            type="button"
            onClick={() => props.store.updateViewMode("grid")}
            class={cn(
              "p-1.5 rounded-lg transition-all duration-150 cursor-pointer",
              props.store.viewMode() === "grid"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
            title="Grid view"
          >
            <Grid3X3 size={15} />
          </button>
          <button
            type="button"
            onClick={() => props.store.updateViewMode("list")}
            class={cn(
              "p-1.5 rounded-lg transition-all duration-150 cursor-pointer",
              props.store.viewMode() === "list"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
            title="List view"
          >
            <List size={15} />
          </button>
        </div>
      </div>

      <Show when={expanded()}>
        <div class="bg-card rounded-lg border border-border shadow-sm p-4 space-y-4">
          <div>
            <p class="text-xs font-semibold text-muted-foreground mb-2">Category</p>
            <div class="flex flex-wrap gap-1.5">
              <For each={Object.keys(CATEGORY_CONFIG) as Category[]}>
                {(cat) => {
                  const config = CATEGORY_CONFIG[cat];
                  const isActive = () => props.store.filter().categories.includes(cat);
                  return (
                    <button
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      class={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all duration-150 cursor-pointer select-none",
                        isActive()
                          ? "bg-primary/10 text-primary border-primary/20 shadow-sm"
                          : "bg-background text-muted-foreground border-border hover:border-foreground/20 hover:bg-muted",
                      )}
                    >
                      {config.label}
                    </button>
                  );
                }}
              </For>
            </div>
          </div>

          <div>
            <p class="text-xs font-semibold text-muted-foreground mb-2">Rating</p>
            <div class="flex flex-wrap gap-2">
              <For each={Object.keys(RATING_CONFIG) as Rating[]}>
                {(rating) => {
                  const config = RATING_CONFIG[rating];
                  const isActive = () => props.store.filter().ratings.includes(rating);
                  return (
                    <button
                      type="button"
                      onClick={() => toggleRating(rating)}
                      class={cn(
                        "transition-all duration-150 cursor-pointer",
                        isActive()
                          ? "scale-105 ring-2 ring-primary/20 rounded-full"
                          : "opacity-50 hover:opacity-75",
                      )}
                    >
                      <Badge
                        variant="outline"
                        class="text-xs"
                        style={{ "border-color": config.color, color: config.color }}
                      >
                        {config.label}
                      </Badge>
                    </button>
                  );
                }}
              </For>
            </div>
          </div>

          <div>
            <p class="text-xs font-semibold text-muted-foreground mb-2">Sort</p>
            <div class="flex flex-wrap gap-1.5">
              <For each={SORT_OPTIONS}>
                {(opt) => {
                  const isActive = () => props.store.filter().sortBy === opt.value;
                  return (
                    <button
                      type="button"
                      onClick={() => props.store.updateFilter({ sortBy: opt.value })}
                      class={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-150 cursor-pointer select-none",
                        isActive()
                          ? "bg-foreground text-background border-foreground"
                          : "bg-background text-muted-foreground border-border hover:border-foreground/20 hover:bg-muted",
                      )}
                    >
                      <opt.icon size={12} />
                      {opt.label}
                    </button>
                  );
                }}
              </For>
            </div>
          </div>

          <Show when={hasActiveFilters()}>
            <div class="pt-2 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  props.store.resetFilter();
                  setExpanded(false);
                }}
                class="text-xs text-muted-foreground"
              >
                <RotateCcw size={12} />
                Reset all filters
              </Button>
            </div>
          </Show>
        </div>
      </Show>

      <Show when={!expanded() && hasActiveFilters()}>
        <div class="flex items-center gap-1.5 flex-wrap">
          <For each={props.store.filter().categories}>
            {(cat) => {
              const config = CATEGORY_CONFIG[cat];
              return (
                <Tag variant="default" removable onRemove={() => toggleCategory(cat)}>
                  {config.label}
                </Tag>
              );
            }}
          </For>
          <For each={props.store.filter().ratings}>
            {(rating) => (
              <button
                type="button"
                onClick={() => toggleRating(rating)}
                class="cursor-pointer hover:opacity-80 transition-opacity"
              >
                <Badge
                  variant="outline"
                  class="text-[11px]"
                  style={{
                    "border-color": RATING_CONFIG[rating].color,
                    color: RATING_CONFIG[rating].color,
                  }}
                >
                  {RATING_CONFIG[rating].label}
                </Badge>
              </button>
            )}
          </For>
          <Show when={props.store.filter().sortBy !== "newest"}>
            <span class="inline-flex items-center px-2 py-0.5 text-[11px] font-medium text-muted-foreground bg-muted border border-border rounded-full">
              {SORT_OPTIONS.find((o) => o.value === props.store.filter().sortBy)?.label}
            </span>
          </Show>
          <Button
            variant="ghost"
            size="sm"
            class="text-[11px] h-auto py-0.5"
            onClick={props.store.resetFilter}
          >
            <RotateCcw size={10} />
            Clear
          </Button>
        </div>
      </Show>
    </div>
  );
}
