import { Show, For, Match, Switch, createSignal, createEffect, type Accessor } from "solid-js";
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
import { Plus, Pencil, Trash2, Share2, ShoppingBag } from "lucide-solid";
import { Link, useNavigate } from "@tanstack/solid-router";
import { useSession } from "~/lib/services/auth";
import { shareLink } from "~/lib/share";
import { PageHeader } from "~/components/PageHeader";
import { EmptyState } from "~/components/EmptyState";
import { WishCard } from "./WishCard";
import type { WishItem } from "~/types";
import { formatPrice } from "./utils";

interface WishPageProps {
  wishes: Accessor<{ items: WishItem[] }>;
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

  const shareWishlistLink = () =>
    void shareLink({
      url: `${window.location.origin}/wish`,
      title: "My Wishlist",
    });

  const shareWishLink = (wishId: string, name?: string) =>
    void shareLink({
      url: `${window.location.origin}/wish?item=${wishId}`,
      title: name,
    });

  createEffect(
    () => ({ data: wishItems(), initialOpenItem: props.initialOpenItem }),
    ({ data, initialOpenItem }) => {
      if (!data || !initialOpenItem) return;
      const target = data.find((item) => item.id === initialOpenItem);
      if (target) {
        setSelectedWish(target);
        setShowWishDetail(true);
      }
    },
  );

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
      <PageHeader
        title="Wishlist"
        actions={
          <>
            <button
              onClick={shareWishlistLink}
              class="flex size-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Share wishlist"
            >
              <Share2 size={11} />
            </button>
            <Show when={user()}>
              <Link
                to="/wish/add"
                class="flex size-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Add wish"
              >
                <Plus size={12} />
              </Link>
            </Show>
          </>
        }
        subtitle={
          <Show when={wishItems()}>
            {(data) => (
              <>
                Wishlist · {data().length} item{data().length !== 1 ? "s" : ""} saved
              </>
            )}
          </Show>
        }
      />

      <Switch>
        <Match when={wishItems()}>
          {(data) => (
            <Show
              when={data().length > 0}
              fallback={
                <EmptyState
                  title="No wishes yet"
                  description={
                    user()
                      ? "Use the add button to save something you want."
                      : "Nothing has been added to this wishlist yet."
                  }
                />
              }
            >
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                        class="size-7 text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          setShowWishDetail(false);
                          navigate({
                            to: "/haul/add",
                            search: { convert: item().id },
                          });
                        }}
                        aria-label="Mark as purchased"
                      >
                        <ShoppingBag size={14} />
                      </Button>
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
