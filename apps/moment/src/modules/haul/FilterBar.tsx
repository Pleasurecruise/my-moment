import { Show, For, createSignal } from "solid-js";
import { Button, Badge, Input, Tag, cn } from "@my-moment/ui";
import {
  Search,
  SlidersHorizontal,
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
} from "~/types/haul";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest", icon: Clock },
  { value: "price-asc", label: "Price Low", icon: ArrowUpAZ },
  { value: "price-desc", label: "Price High", icon: ArrowDownAZ },
  { value: "rating", label: "Top Rated", icon: Star },
] as const;

interface FilterBarProps {
  store: {
    filter: () => FilterState;
    updateFilter: (partial: Partial<FilterState>) => void;
    resetFilter: () => void;
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
    <div class="space-y-4">
      <div class="group relative flex h-11 items-center border-y border-border/70 bg-background/60 transition-colors focus-within:border-foreground/40">
        <Search
          size={15}
          class="pointer-events-none absolute left-3 text-muted-foreground/70 transition-colors group-focus-within:text-foreground"
          aria-hidden="true"
        />
        <Input
          type="text"
          value={props.store.filter().search}
          onInput={(event) => props.store.updateFilter({ search: event.currentTarget.value })}
          placeholder="Search items, brands, categories…"
          aria-label="Search collection"
          class="h-full rounded-none border-0 bg-transparent pl-10 pr-24 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        <div class="absolute inset-y-0 right-0 flex items-center">
          <Show when={props.store.filter().search}>
            <button
              type="button"
              onClick={() => props.store.updateFilter({ search: "" })}
              class="flex size-9 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
              aria-label="Clear collection search"
            >
              <X size={13} />
            </button>
          </Show>
          <button
            type="button"
            onClick={() => setExpanded(!expanded())}
            aria-expanded={expanded()}
            aria-label="Toggle collection filters"
            class={cn(
              "relative flex h-full w-11 items-center justify-center border-l border-border/70 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
              expanded() &&
                "bg-foreground text-background hover:bg-foreground hover:text-background",
            )}
          >
            <SlidersHorizontal size={15} />
            <Show when={hasActiveFilters() && !expanded()}>
              <span class="absolute right-2 top-2 size-1.5 rounded-full bg-accent" />
            </Show>
          </button>
        </div>
      </div>

      <Show when={expanded()}>
        <div class="grid gap-5 border-y border-border/70 py-4 lg:grid-cols-3 lg:gap-0 lg:divide-x lg:divide-border/70">
          <section class="min-w-0 lg:pr-6">
            <p class="mb-3 font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Category
            </p>
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
                        "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        isActive()
                          ? "border-foreground bg-foreground text-background shadow-sm"
                          : "border-border/80 bg-background/40 text-muted-foreground hover:border-foreground/25 hover:bg-muted hover:text-foreground",
                      )}
                      aria-pressed={isActive()}
                    >
                      {config.label}
                    </button>
                  );
                }}
              </For>
            </div>
          </section>

          <section class="min-w-0 lg:px-6">
            <p class="mb-3 font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Rating
            </p>
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
                        "rounded-full transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        isActive() ? "opacity-100" : "opacity-45 hover:opacity-75",
                      )}
                      aria-pressed={isActive()}
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
          </section>

          <section class="min-w-0 lg:pl-6">
            <p class="mb-3 font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Order
            </p>
            <div class="flex flex-wrap gap-1.5">
              <For each={SORT_OPTIONS}>
                {(opt) => {
                  const isActive = () => props.store.filter().sortBy === opt.value;
                  return (
                    <button
                      type="button"
                      onClick={() => props.store.updateFilter({ sortBy: opt.value })}
                      class={cn(
                        "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        isActive()
                          ? "border-foreground bg-foreground text-background shadow-sm"
                          : "border-border/80 bg-background/40 text-muted-foreground hover:border-foreground/25 hover:bg-muted hover:text-foreground",
                      )}
                      aria-pressed={isActive()}
                    >
                      <opt.icon size={12} />
                      {opt.label}
                    </button>
                  );
                }}
              </For>
            </div>
          </section>

          <Show when={hasActiveFilters()}>
            <div class="border-t border-border/70 pt-3 lg:col-span-3 lg:mt-5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  props.store.resetFilter();
                  setExpanded(false);
                }}
                class="h-auto px-2 py-1 text-xs text-muted-foreground"
              >
                <RotateCcw size={12} />
                Reset all filters
              </Button>
            </div>
          </Show>
        </div>
      </Show>

      <Show when={!expanded() && hasActiveFilters()}>
        <div class="flex flex-wrap items-center gap-1.5">
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
                class="transition-opacity hover:opacity-80"
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
            <Badge variant="outline" class="px-1.5 py-0 text-[11px]">
              {SORT_OPTIONS.find((o) => o.value === props.store.filter().sortBy)?.label}
            </Badge>
          </Show>
          <Button
            variant="ghost"
            size="sm"
            class="h-auto py-0.5 text-[11px]"
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
