import {
  Show,
  For,
  Match,
  Switch,
  createSignal,
  createMemo,
  createEffect,
  type Resource,
} from "solid-js";
import {
  Dialog,
  DialogContent,
  DialogBody,
  Button,
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
  toast,
} from "@my-moment/ui";
import { ShoppingBag, Heart, Plus, SlidersHorizontal, Pencil, Trash2, Share2 } from "lucide-solid";
import { Link, useNavigate } from "@tanstack/solid-router";
import { Segment } from "~/components/Segment";
import { useSession } from "~/lib/services/auth";
import { GoodsCard } from "./GoodsCard";
import { WishCard } from "./WishCard";
import { FilterBar } from "./FilterBar";
import type { GoodsItem, FilterState, ViewMode, Rating, WishItem } from "./types";
import { formatPrice } from "./utils";

const VIEW_OPTIONS = [
  { value: "grid" as const, label: "Grid" },
  { value: "list" as const, label: "List" },
];

interface HaulPageProps {
  haul: Resource<{ items: GoodsItem[] } | undefined>;
  wishes: Resource<{ items: WishItem[] } | undefined>;
  onRetry: () => void;
  onWishRetry: () => void;
  initialOpenItem?: string;
  initialOpenWish?: string;
}

export function HaulPage(props: HaulPageProps) {
  const session = useSession();
  const navigate = useNavigate();
  const user = () => session()?.data?.user ?? null;

  const items = () => props.haul()?.items;
  const wishItems = () => props.wishes()?.items;

  const [viewMode, setViewMode] = createSignal<ViewMode>("grid");
  const [filter, setFilter] = createSignal<FilterState>({
    search: "",
    categories: [],
    ratings: [],
    sortBy: "newest",
  });
  const [showFilters, setShowFilters] = createSignal(false);

  const [selectedItem, setSelectedItem] = createSignal<GoodsItem | null>(null);
  const [showDetail, setShowDetail] = createSignal(false);
  const [deletingItem, setDeletingItem] = createSignal<GoodsItem | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = createSignal(false);

  const [selectedWish, setSelectedWish] = createSignal<WishItem | null>(null);
  const [showWishDetail, setShowWishDetail] = createSignal(false);
  const [deletingWish, setDeletingWish] = createSignal<WishItem | null>(null);
  const [showWishDelete, setShowWishDelete] = createSignal(false);

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
    const ratingOrder: Record<Rating, number> = { worth: 1, great: 2, amazing: 3, godtier: 4 };
    switch (f.sortBy) {
      case "newest":
        result.sort(
          (a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime(),
        );
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
    return { total: data.length, totalSpent: data.reduce((sum, i) => sum + i.price, 0) };
  });

  const updateFilter = (partial: Partial<FilterState>) =>
    setFilter((prev) => ({ ...prev, ...partial }));
  const resetFilter = () =>
    setFilter({ search: "", categories: [], ratings: [], sortBy: "newest" });

  const store = {
    items,
    viewMode,
    filter,
    filteredItems,
    stats,
    updateFilter,
    resetFilter,
    updateViewMode: setViewMode,
  };

  const shareHaulLink = () => {
    navigator.clipboard
      ?.writeText(`${window.location.origin}/haul`)
      .then(() => toast.success("Link copied"));
  };

  const shareWishlistLink = () => {
    navigator.clipboard
      ?.writeText(`${window.location.origin}/haul#wishlist`)
      .then(() => toast.success("Link copied"));
  };

  const shareItemLink = (itemId: string) => {
    navigator.clipboard
      ?.writeText(`${window.location.origin}/haul?item=${itemId}`)
      .then(() => toast.success("Link copied"));
  };

  const shareWishLink = (wishId: string) => {
    navigator.clipboard
      ?.writeText(`${window.location.origin}/haul?wish=${wishId}`)
      .then(() => toast.success("Link copied"));
  };

  createEffect(() => {
    const data = items();
    if (!data || !props.initialOpenItem) return;
    const target = data.find((i) => i.id === props.initialOpenItem);
    if (target) {
      setSelectedItem(target);
      setShowDetail(true);
    }
  });

  createEffect(() => {
    const data = wishItems();
    if (!data || !props.initialOpenWish) return;
    const target = data.find((i) => i.id === props.initialOpenWish);
    if (target) {
      setSelectedWish(target);
      setShowWishDetail(true);
    }
  });

  const handleDelete = async () => {
    const item = deletingItem();
    if (!item) return;
    try {
      const res = await fetch(`/api/haul/${item.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Item deleted");
        setShowDeleteAlert(false);
        setDeletingItem(null);
        props.onRetry();
      } else {
        toast.error("Failed to delete item");
      }
    } catch (e) {
      console.error("Failed to delete haul item:", e);
      toast.error("Failed to delete item");
    }
  };

  const handleWishDelete = async () => {
    const item = deletingWish();
    if (!item) return;
    try {
      const res = await fetch(`/api/wish/${item.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Removed from wishlist");
        setShowWishDelete(false);
        setDeletingWish(null);
        props.onWishRetry();
      } else {
        toast.error("Failed to remove item");
      }
    } catch (e) {
      console.error("Failed to delete wish item:", e);
      toast.error("Failed to remove item");
    }
  };

  return (
    <div>
      <div class="mb-6 flex items-center justify-between">
        <div>
          <div class="flex items-center gap-2">
            <h2 class="text-lg font-semibold text-foreground">Haul</h2>
            <button
              onClick={shareHaulLink}
              class="flex size-5 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Share haul"
            >
              <Share2 size={11} />
            </button>
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
          <Button
            variant={showFilters() ? "default" : "ghost"}
            size="icon"
            class="size-8"
            onClick={() => setShowFilters(!showFilters())}
            aria-label="Toggle filters"
          >
            <SlidersHorizontal size={16} />
          </Button>
          <Segment options={VIEW_OPTIONS} value={viewMode()} onChange={setViewMode} />
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
            <Button variant="link" size="sm" class="text-xs mt-2" onClick={props.onRetry}>
              Retry
            </Button>
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
                          {(item) => (
                            <GoodsCard
                              item={item}
                              onClick={(i) => {
                                setSelectedItem(i);
                                setShowDetail(true);
                              }}
                              compact
                            />
                          )}
                        </For>
                      </div>
                    }
                  >
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <For each={filteredItems()}>
                        {(item) => (
                          <GoodsCard
                            item={item}
                            onClick={(i) => {
                              setSelectedItem(i);
                              setShowDetail(true);
                            }}
                          />
                        )}
                      </For>
                    </div>
                  </Show>
                </Show>
              </Show>
              <Show when={data().length > 0}>
                <div class="h-4" />
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
                    <div class="flex items-center gap-1 ml-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        class="size-7 text-muted-foreground hover:text-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
                        onClick={() => shareItemLink(item().id)}
                        aria-label="Share item"
                      >
                        <Share2 size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        class="size-7 text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          setShowDetail(false);
                          navigate({ to: "/haul/add", search: { edit: item().id } });
                        }}
                        aria-label="Edit item"
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        class="size-7 text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          setShowDetail(false);
                          setDeletingItem(item());
                          setShowDeleteAlert(true);
                        }}
                        aria-label="Delete item"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
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
                      {(() => {
                        const link = item().purchaseLink!;
                        return /^https?:\/\//.test(link) ? (
                          <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                          >
                            Buy again →
                          </a>
                        ) : (
                          <span class="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                            <span class="inline-block w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
                            Delisted
                          </span>
                        );
                      })()}
                    </Show>
                  </div>
                </>
              )}
            </Show>
          </DialogBody>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteAlert()} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Item</AlertDialogTitle>
            <AlertDialogDescription>
              Remove "{deletingItem()?.name ?? ""}" from your haul? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              as={Button}
              variant="outline"
              onClick={() => {
                setShowDeleteAlert(false);
                setDeletingItem(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction as={Button} variant="destructive" onClick={handleDelete}>
              <Trash2 size={14} />
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <section id="wishlist" class="mt-4">
        <div class="mb-6 flex items-center justify-between">
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-lg font-semibold text-foreground">Wishlist</h2>
              <button
                onClick={shareWishlistLink}
                class="flex size-5 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Share wishlist"
              >
                <Share2 size={11} />
              </button>
              <Show when={user()}>
                <Link
                  to="/wish/add"
                  class="flex size-5 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Add wish"
                >
                  <Plus size={12} />
                </Link>
              </Show>
            </div>
            <Show when={wishItems()}>
              {(data) => (
                <p class="mt-1 text-sm text-muted-foreground">
                  {data().length} item{data().length !== 1 ? "s" : ""} saved
                </p>
              )}
            </Show>
          </div>
        </div>

        <Switch>
          <Match when={props.wishes.error}>
            <div class="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <p class="text-sm">Failed to load</p>
              <Button variant="link" size="sm" class="text-xs mt-2" onClick={props.onWishRetry}>
                Retry
              </Button>
            </div>
          </Match>
          <Match when={props.wishes.loading}>
            <div class="flex items-center justify-center py-16 text-muted-foreground">
              <p class="text-sm">Loading...</p>
            </div>
          </Match>
          <Match when={wishItems()}>
            {(data) => (
              <Show
                when={data().length > 0}
                fallback={
                  <div class="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <Heart class="mb-4 h-10 w-10 opacity-30" />
                    <p class="text-sm">No wishes yet.</p>
                    <Show when={user()}>
                      <p class="mt-1 text-xs opacity-60">Click + to save something you want.</p>
                    </Show>
                  </div>
                }
              >
                <div class="space-y-2">
                  <For each={data()}>
                    {(item) => (
                      <WishCard
                        item={item}
                        onClick={(i) => {
                          setSelectedWish(i);
                          setShowWishDetail(true);
                        }}
                      />
                    )}
                  </For>
                </div>
              </Show>
            )}
          </Match>
        </Switch>

        <Dialog open={showWishDetail()} onOpenChange={setShowWishDetail}>
          <DialogContent onClose={() => setShowWishDetail(false)}>
            <DialogBody>
              <Show when={selectedWish()}>
                {(item) => (
                  <>
                    <div class="flex items-center justify-between mb-4">
                      <h2 class="text-lg font-semibold">{item().name}</h2>
                      <div class="flex items-center gap-1 ml-2 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          class="size-7 text-muted-foreground hover:text-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
                          onClick={() => shareWishLink(item().id)}
                          aria-label="Share wish"
                        >
                          <Share2 size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          class="size-7 text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            setShowWishDetail(false);
                            navigate({ to: "/wish/add", search: { edit: item().id } });
                          }}
                          aria-label="Edit wish"
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          class="size-7 text-muted-foreground hover:text-destructive"
                          onClick={() => {
                            setShowWishDetail(false);
                            setDeletingWish(item());
                            setShowWishDelete(true);
                          }}
                          aria-label="Delete wish"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
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
                    </div>
                  </>
                )}
              </Show>
            </DialogBody>
          </DialogContent>
        </Dialog>

        <AlertDialog open={showWishDelete()} onOpenChange={setShowWishDelete}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Wish</AlertDialogTitle>
              <AlertDialogDescription>
                Remove "{deletingWish()?.name ?? ""}" from your wishlist?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                as={Button}
                variant="outline"
                onClick={() => {
                  setShowWishDelete(false);
                  setDeletingWish(null);
                }}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction as={Button} variant="destructive" onClick={handleWishDelete}>
                <Trash2 size={14} />
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
    </div>
  );
}
