import { Show, For, Match, Switch, createSignal, createMemo, type Resource } from "solid-js";
import { Dialog, DialogContent, DialogBody } from "@my-moment/ui";
import { ShoppingBag, Plus, SlidersHorizontal } from "lucide-solid";
import { Link } from "@tanstack/solid-router";
import { Segment } from "~/components/Segment";
import { useSession } from "~/lib/services/auth";
import { GoodsCard } from "./GoodsCard";
import { FilterBar } from "./FilterBar";
import type { GoodsItem, FilterState, ViewMode, Rating } from "./types";
import { formatPrice } from "./utils";

const VIEW_OPTIONS = [
  { value: "grid" as const, label: "Grid" },
  { value: "list" as const, label: "List" },
];

interface HaulPageProps {
  haul: Resource<{ items: GoodsItem[] } | undefined>;
  onRetry: () => void;
}

export function HaulPage(props: HaulPageProps) {
  const session = useSession();
  const user = () => session()?.data?.user ?? null;

  const items = () => props.haul()?.items;

  const [viewMode, setViewMode] = createSignal<ViewMode>("grid");
  const [filter, setFilter] = createSignal<FilterState>({
    search: "",
    categories: [],
    ratings: [],
    sortBy: "newest",
  });
  const [selectedItem, setSelectedItem] = createSignal<GoodsItem | null>(null);
  const [showDetail, setShowDetail] = createSignal(false);
  const [showFilters, setShowFilters] = createSignal(false);

  const filteredItems = createMemo(() => {
    const data = items();
    if (!data) return [];

    let result = [...data];
    const f = filter();

    if (f.search) {
      const q = f.search.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.brand?.toLowerCase().includes(q) ||
          item.comment.toLowerCase().includes(q),
      );
    }

    if (f.categories.length > 0) {
      result = result.filter((item) => f.categories.includes(item.category));
    }

    if (f.ratings.length > 0) {
      result = result.filter((item) => f.ratings.includes(item.rating));
    }

    const ratingOrder: Record<Rating, number> = {
      worth: 1,
      great: 2,
      amazing: 3,
      godtier: 4,
    };

    switch (f.sortBy) {
      case "newest":
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case "price-asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        result.sort((a, b) => ratingOrder[b.rating] - ratingOrder[a.rating]);
        break;
    }

    return result;
  });

  const stats = createMemo(() => {
    const data = items();
    if (!data) return { total: 0, totalSpent: 0 };
    const total = data.length;
    const totalSpent = data.reduce((sum, item) => sum + item.price, 0);
    return { total, totalSpent };
  });

  const updateFilter = (partial: Partial<FilterState>) => {
    setFilter((prev) => ({ ...prev, ...partial }));
  };

  const resetFilter = () => {
    setFilter({ search: "", categories: [], ratings: [], sortBy: "newest" });
  };

  const updateViewMode = (mode: ViewMode) => {
    setViewMode(mode);
  };

  const handleCardClick = (item: GoodsItem) => {
    setSelectedItem(item);
    setShowDetail(true);
  };

  const store = {
    items,
    viewMode,
    filter,
    filteredItems,
    stats,
    updateFilter,
    resetFilter,
    updateViewMode,
  };

  return (
    <div>
      <div class="mb-6 flex items-center justify-between">
        <div>
          <div class="flex items-center gap-2">
            <h2 class="text-lg font-semibold text-foreground">Haul</h2>
            <Show when={user()}>
              <Link
                to="/haul/add"
                class="flex size-5 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Add item"
              >
                <Plus size={12} />
              </Link>
            </Show>
          </div>
          <Show when={items()}>
            {(data) => (
              <p class="mt-1 text-sm text-muted-foreground">
                {data().length} item{data().length !== 1 ? "s" : ""}
                <Show when={filteredItems().length !== data().length}>
                  <span class="text-muted-foreground/60"> (filtered from {data().length})</span>
                </Show>
                <Show when={stats().totalSpent > 0}>
                  <span class="text-muted-foreground/60">
                    {" "}
                    · {formatPrice(stats().totalSpent)} total
                  </span>
                </Show>
              </p>
            )}
          </Show>
        </div>
        <div class="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters())}
            class={`flex size-8 items-center justify-center rounded-md transition-colors ${
              showFilters()
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
            aria-label="Toggle filters"
          >
            <SlidersHorizontal size={16} />
          </button>
          <Segment options={VIEW_OPTIONS} value={viewMode()} onChange={updateViewMode} />
        </div>
      </div>

      <Show when={showFilters()}>
        <div class="mb-6 rounded-lg border border-border bg-card p-4">
          <FilterBar store={store} />
        </div>
      </Show>

      <Switch>
        <Match when={props.haul.error}>
          <div class="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <p class="text-sm">Failed to load</p>
            <button onClick={props.onRetry} class="mt-2 text-xs text-primary hover:underline">
              Retry
            </button>
          </div>
        </Match>
        <Match when={props.haul.loading}>
          <div class="flex items-center justify-center py-20 text-muted-foreground">
            <p class="text-sm">Loading...</p>
          </div>
        </Match>
        <Match when={items()}>
          {(data) => (
            <>
              <Show
                when={data().length > 0}
                fallback={
                  <div class="flex flex-col items-center justify-center py-20 text-muted-foreground">
                    <ShoppingBag class="mb-4 h-12 w-12 opacity-40" />
                    <p class="text-sm">No items yet.</p>
                    <Show when={user()}>
                      <p class="mt-1 text-xs opacity-60">Click + to add your first item.</p>
                    </Show>
                  </div>
                }
              >
                <Show
                  when={filteredItems().length > 0}
                  fallback={
                    <div class="flex flex-col items-center justify-center py-20 text-muted-foreground">
                      <ShoppingBag class="mb-4 h-12 w-12 opacity-40" />
                      <p class="text-sm">No matching items.</p>
                      <p class="mt-1 text-xs opacity-60">Try adjusting your filters.</p>
                    </div>
                  }
                >
                  <Show
                    when={viewMode() === "grid"}
                    fallback={
                      <div class="space-y-2">
                        <For each={filteredItems()}>
                          {(item) => <GoodsCard item={item} onClick={handleCardClick} compact />}
                        </For>
                      </div>
                    }
                  >
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <For each={filteredItems()}>
                        {(item) => <GoodsCard item={item} onClick={handleCardClick} />}
                      </For>
                    </div>
                  </Show>
                </Show>
              </Show>

              <Show when={data().length > 0}>
                <div class="h-12" />
              </Show>
            </>
          )}
        </Match>
      </Switch>

      <Dialog open={showDetail()} onOpenChange={setShowDetail}>
        <DialogContent onClose={() => setShowDetail(false)}>
          <DialogBody>
            <Show when={selectedItem()}>
              {(item) => (
                <>
                  <div class="flex items-center justify-between mb-4">
                    <h2 class="text-lg font-semibold">{item().name}</h2>
                  </div>

                  <Show when={item().imageUrl}>
                    <div class="mb-4 rounded-lg overflow-hidden border border-border">
                      <img
                        src={item().imageUrl}
                        alt={item().name}
                        class="w-full max-h-60 object-cover"
                      />
                    </div>
                  </Show>

                  <div class="space-y-3">
                    <Show when={item().brand}>
                      <p class="text-sm text-muted-foreground">Brand: {item().brand}</p>
                    </Show>
                    <p class="text-lg font-bold text-primary">{formatPrice(item().price)}</p>
                    <Show when={item().comment}>
                      <blockquote class="pl-4 py-2 border-l-4 border-primary/30 bg-primary/5 rounded-r-lg">
                        <p class="text-sm text-muted-foreground italic">"{item().comment}"</p>
                      </blockquote>
                    </Show>
                    <Show when={item().purchaseLink}>
                      <a
                        href={item().purchaseLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        Buy again →
                      </a>
                    </Show>
                  </div>
                </>
              )}
            </Show>
          </DialogBody>
        </DialogContent>
      </Dialog>
    </div>
  );
}
