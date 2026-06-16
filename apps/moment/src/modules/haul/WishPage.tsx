import { Show, For, Match, Switch, createSignal, createEffect, type Resource } from "solid-js";
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
  Spinner,
  toast,
} from "@my-moment/ui";
import { Heart, Plus, Pencil, Trash2, Share2 } from "lucide-solid";
import { Link, useNavigate } from "@tanstack/solid-router";
import { useSession } from "~/lib/services/auth";
import { WishCard } from "./WishCard";
import type { WishItem } from "./types";
import { formatPrice } from "./utils";

interface WishPageProps {
  wishes: Resource<{ items: WishItem[] } | undefined>;
  onRetry: () => void;
  initialOpenItem?: string;
}

export function WishPage(props: WishPageProps) {
  const session = useSession();
  const navigate = useNavigate();
  const user = () => session()?.data?.user ?? null;

  const wishItems = () => props.wishes()?.items;

  const [selectedWish, setSelectedWish] = createSignal<WishItem | null>(null);
  const [showWishDetail, setShowWishDetail] = createSignal(false);
  const [deletingWish, setDeletingWish] = createSignal<WishItem | null>(null);
  const [showWishDelete, setShowWishDelete] = createSignal(false);

  const shareWishlistLink = () => {
    const url = `${window.location.origin}/wish`;
    navigator.clipboard
      ?.writeText(url)
      .then(() => toast.success("Link copied"))
      .catch(() => navigator.share?.({ url, title: "My Wishlist" }));
  };

  const shareWishLink = (wishId: string, name?: string) => {
    const url = `${window.location.origin}/wish?item=${wishId}`;
    navigator.clipboard
      ?.writeText(url)
      .then(() => toast.success("Link copied"))
      .catch(() => navigator.share?.({ url, title: name }));
  };

  createEffect(() => {
    const data = wishItems();
    if (!data || !props.initialOpenItem) return;
    const target = data.find((i) => i.id === props.initialOpenItem);
    if (target) {
      setSelectedWish(target);
      setShowWishDetail(true);
    }
  });

  const handleWishDelete = async () => {
    const item = deletingWish();
    if (!item) return;
    try {
      const res = await fetch(`/api/wish/${item.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Removed from wishlist");
        setShowWishDelete(false);
        setDeletingWish(null);
        props.onRetry();
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
            <Button variant="link" size="sm" class="text-xs mt-2" onClick={props.onRetry}>
              Retry
            </Button>
          </div>
        </Match>
        <Match when={props.wishes.loading && !wishItems()}>
          <div class="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Spinner size="sm" />
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
                        onClick={() => shareWishLink(item().id, item().name)}
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
                          navigate({
                            to: "/wish/add",
                            search: { edit: item().id },
                          });
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
    </div>
  );
}
