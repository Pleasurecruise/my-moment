import { Show, For, Match, Switch, createSignal, createMemo, type Resource } from "solid-js";
import {
  Dialog,
  DialogContent,
  DialogBody,
  DialogTitle,
  Button,
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
  Input,
  toast,
} from "@my-moment/ui";
import {
  ShoppingBag,
  Heart,
  Plus,
  SlidersHorizontal,
  Search,
  Pencil,
  Trash2,
  ExternalLink,
  Share2,
} from "lucide-solid";
import { Link } from "@tanstack/solid-router";
import { Segment } from "~/components/Segment";
import { useSession } from "~/lib/services/auth";
import { GoodsCard } from "./GoodsCard";
import { GoodsForm } from "./GoodsForm";
import { WishCard } from "./WishCard";
import { WishForm } from "./WishForm";
import { FilterBar } from "./FilterBar";
import type {
  GoodsItem,
  FilterState,
  ViewMode,
  Rating,
  GoodsFormData,
  WishItem,
  WishFormData,
  WishFilterState,
} from "./types";
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
  const [editingItem, setEditingItem] = createSignal<GoodsItem | null>(null);
  const [showEditDialog, setShowEditDialog] = createSignal(false);
  const [deletingItem, setDeletingItem] = createSignal<GoodsItem | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = createSignal(false);

  const wishItems = () => props.wishes()?.items;
  const [wishFilter, setWishFilter] = createSignal<WishFilterState>({
    search: "",
    categories: [],
    sortBy: "newest",
  });
  const [selectedWish, setSelectedWish] = createSignal<WishItem | null>(null);
  const [showWishDetail, setShowWishDetail] = createSignal(false);
  const [editingWish, setEditingWish] = createSignal<WishItem | null>(null);
  const [showWishEdit, setShowWishEdit] = createSignal(false);
  const [showWishAdd, setShowWishAdd] = createSignal(false);
  const [deletingWish, setDeletingWish] = createSignal<WishItem | null>(null);
  const [showWishDelete, setShowWishDelete] = createSignal(false);

  const filteredWishes = createMemo(() => {
    const data = wishItems();
    if (!data) return [];
    let result = [...data];
    const f = wishFilter();
    if (f.search) {
      const q = f.search.toLowerCase();
      result = result.filter(
        (item) => item.name.toLowerCase().includes(q) || item.brand?.toLowerCase().includes(q),
      );
    }
    if (f.categories.length > 0) {
      result = result.filter((item) => f.categories.includes(item.category));
    }
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
    }
    return result;
  });

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

  const handleEditClick = (item: GoodsItem) => {
    setShowDetail(false);
    setEditingItem(item);
    setShowEditDialog(true);
  };

  const handleDeleteClick = (item: GoodsItem) => {
    setShowDetail(false);
    setDeletingItem(item);
    setShowDeleteAlert(true);
  };

  const handleUpdate = async (data: GoodsFormData): Promise<GoodsItem | null> => {
    const item = editingItem();
    if (!item) return null;
    try {
      const res = await fetch(`/api/haul/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const updated = (await res.json()) as GoodsItem;
        toast.success("Item updated");
        props.onRetry();
        return updated;
      }
      toast.error("Failed to update item");
      return null;
    } catch (e) {
      console.error("Failed to update haul item:", e);
      toast.error("Failed to update item");
      return null;
    }
  };

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

  const handleWishClick = (item: WishItem) => {
    setSelectedWish(item);
    setShowWishDetail(true);
  };

  const handleWishEditClick = (item: WishItem) => {
    setShowWishDetail(false);
    setEditingWish(item);
    setShowWishEdit(true);
  };

  const handleWishDeleteClick = (item: WishItem) => {
    setShowWishDetail(false);
    setDeletingWish(item);
    setShowWishDelete(true);
  };

  const handleWishAdd = async (data: WishFormData): Promise<WishItem | null> => {
    try {
      const res = await fetch("/api/wish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const item = (await res.json()) as WishItem;
        toast.success("Added to wishlist");
        props.onWishRetry();
        return item;
      }
      toast.error("Failed to add item");
      return null;
    } catch (e) {
      console.error("Failed to create wish item:", e);
      toast.error("Failed to add item");
      return null;
    }
  };

  const handleWishUpdate = async (data: WishFormData): Promise<WishItem | null> => {
    const item = editingWish();
    if (!item) return null;
    try {
      const res = await fetch(`/api/wish/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const updated = (await res.json()) as WishItem;
        toast.success("Wish updated");
        props.onWishRetry();
        return updated;
      }
      toast.error("Failed to update wish");
      return null;
    } catch (e) {
      console.error("Failed to update wish item:", e);
      toast.error("Failed to update wish");
      return null;
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
            <button
              onClick={() => {
                const url = `${window.location.origin}/haul`;
                navigator.clipboard?.writeText(url).then(() => toast.success("Link copied"));
              }}
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
                    <div class="flex items-center gap-1 ml-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        class="size-7 text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          const url = `${window.location.origin}/haul`;
                          navigator.clipboard
                            ?.writeText(url)
                            .then(() => toast.success("Link copied"));
                        }}
                        aria-label="Share item"
                      >
                        <Share2 size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        class="size-7 text-muted-foreground hover:text-foreground"
                        onClick={() => handleEditClick(item())}
                        aria-label="Edit item"
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        class="size-7 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteClick(item())}
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
                        const isUrl = /^https?:\/\//.test(link);
                        return isUrl ? (
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

      <Dialog open={showEditDialog()} onOpenChange={setShowEditDialog}>
        <DialogContent onClose={() => setShowEditDialog(false)}>
          <DialogBody>
            <Show when={editingItem()}>
              {(item) => (
                <>
                  <DialogTitle class="mb-4">Edit Item</DialogTitle>
                  <GoodsForm
                    addItem={handleUpdate}
                    editItem={item()}
                    onSuccess={() => {
                      setShowEditDialog(false);
                      setEditingItem(null);
                    }}
                    onCancel={() => {
                      setShowEditDialog(false);
                      setEditingItem(null);
                    }}
                  />
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

      <section class="mt-12">
        <div class="mb-6 flex items-center justify-between">
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-lg font-semibold text-foreground">Wishlist</h2>
              <button
                onClick={() => {
                  const url = `${window.location.origin}/haul`;
                  navigator.clipboard?.writeText(url).then(() => toast.success("Link copied"));
                }}
                class="flex size-5 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Share wishlist"
              >
                <Share2 size={11} />
              </button>
              <Show when={user()}>
                <button
                  onClick={() => setShowWishAdd(true)}
                  class="flex size-5 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Add wish"
                >
                  <Plus size={12} />
                </button>
              </Show>
            </div>
            <Show when={wishItems()}>
              {(data) => (
                <p class="mt-1 text-sm text-muted-foreground">
                  {data().length} item{data().length !== 1 ? "s" : ""} saved
                  <Show when={filteredWishes().length !== data().length}>
                    <span class="text-muted-foreground/60"> (filtered from {data().length})</span>
                  </Show>
                </p>
              )}
            </Show>
          </div>
          <div class="relative flex-1 max-w-xs ml-4">
            <Search
              size={14}
              class="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <Input
              type="text"
              value={wishFilter().search}
              onInput={(e) => setWishFilter((prev) => ({ ...prev, search: e.currentTarget.value }))}
              placeholder="Search wishlist..."
              class="pl-8 h-8 text-xs"
            />
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
                <Show
                  when={filteredWishes().length > 0}
                  fallback={
                    <div class="flex flex-col items-center justify-center py-16 text-muted-foreground">
                      <Search class="mb-4 h-10 w-10 opacity-30" />
                      <p class="text-sm">No matching wishes.</p>
                    </div>
                  }
                >
                  <div class="space-y-2">
                    <For each={filteredWishes()}>
                      {(item) => <WishCard item={item} onClick={handleWishClick} />}
                    </For>
                  </div>
                </Show>
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
                          class="size-7 text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            const url = `${window.location.origin}/haul`;
                            navigator.clipboard
                              ?.writeText(url)
                              .then(() => toast.success("Link copied"));
                          }}
                          aria-label="Share wish"
                        >
                          <Share2 size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          class="size-7 text-muted-foreground hover:text-foreground"
                          onClick={() => handleWishEditClick(item())}
                          aria-label="Edit wish"
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          class="size-7 text-muted-foreground hover:text-destructive"
                          onClick={() => handleWishDeleteClick(item())}
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
                      <Show when={item().purchaseLink}>
                        {(() => {
                          const link = item().purchaseLink!;
                          const isUrl = /^https?:\/\//.test(link);
                          return isUrl ? (
                            <a
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              class="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                            >
                              <ExternalLink size={14} />
                              Open link
                            </a>
                          ) : (
                            <span class="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                              <span class="inline-block w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
                              No link
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

        <Dialog open={showWishAdd()} onOpenChange={setShowWishAdd}>
          <DialogContent onClose={() => setShowWishAdd(false)}>
            <DialogBody>
              <DialogTitle class="mb-4">Add to Wishlist</DialogTitle>
              <WishForm
                addItem={handleWishAdd}
                onSuccess={() => setShowWishAdd(false)}
                onCancel={() => setShowWishAdd(false)}
              />
            </DialogBody>
          </DialogContent>
        </Dialog>

        <Dialog open={showWishEdit()} onOpenChange={setShowWishEdit}>
          <DialogContent onClose={() => setShowWishEdit(false)}>
            <DialogBody>
              <Show when={editingWish()}>
                {(item) => (
                  <>
                    <DialogTitle class="mb-4">Edit Wish</DialogTitle>
                    <WishForm
                      addItem={handleWishUpdate}
                      editItem={item()}
                      onSuccess={() => {
                        setShowWishEdit(false);
                        setEditingWish(null);
                      }}
                      onCancel={() => {
                        setShowWishEdit(false);
                        setEditingWish(null);
                      }}
                    />
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
