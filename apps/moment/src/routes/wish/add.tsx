import { createFileRoute, useNavigate, useSearch } from "@tanstack/solid-router";
import { Errored, Loading, Show, createMemo } from "solid-js";
import { z } from "zod";
import { ArrowLeft, Heart } from "lucide-solid";
import { Button, Spinner, toast } from "@my-moment/ui";
import { WishForm } from "~/modules/haul";
import { wishItemSchema, type WishFormInput, type WishItem } from "~/types";
import { privatePageMeta } from "~/lib/seo";

type SourceState =
  | { status: "create"; item: null }
  | { status: "missing"; item: null }
  | { status: "wishlist"; item: WishItem };

export const Route = createFileRoute("/wish/add")({
  component: WishFormPage,
  validateSearch: z.object({
    edit: z.string().trim().min(1).optional(),
  }),
  head: () => ({ meta: privatePageMeta("Add to Wishlist") }),
});

function WishFormPage() {
  const search = useSearch({ from: "/wish/add" });
  const navigate = useNavigate({ from: "/wish/add" });

  const source = createMemo<SourceState>(async () => {
    const id = search().edit;
    if (!id) return { status: "create", item: null };
    const response = await fetch(`/api/wish/${id}`);
    if (response.status === 404) return { status: "missing", item: null };
    if (response.status === 401 || response.status === 403) {
      throw new Error("You do not have permission to load this item.");
    }
    if (!response.ok) throw new Error(`Could not load this item (${response.status}).`);
    return { status: "wishlist", item: wishItemSchema.parse(await response.json()) };
  });

  const back = () => navigate({ to: "/wish" });
  const saveWish = async (data: WishFormInput) => {
    const id = search().edit;
    const response = await fetch(id ? `/api/wish/${id}` : "/api/wish", {
      method: id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      toast.error("Failed to save wish");
      return null;
    }
    toast.success(id ? "Wish updated" : "Added to wishlist");
    return wishItemSchema.parse(await response.json());
  };

  return (
    <main class="mx-auto max-w-2xl space-y-6">
      <div class="flex items-center gap-3">
        <Button variant="ghost" size="icon" class="size-8" onClick={back}>
          <ArrowLeft size={16} />
        </Button>
        <div class="flex items-center gap-2">
          <Heart size={18} class="text-muted-foreground" />
          <h1 class="text-lg font-semibold">{search().edit ? "Edit wish" : "Add a wish"}</h1>
        </div>
      </div>
      <Errored
        fallback={(error, reset) => (
          <div class="flex flex-col items-center gap-3 py-12 text-center">
            <p class="text-sm text-destructive">{String(error())}</p>
            <div class="flex gap-2">
              <Button variant="outline" size="sm" onClick={reset}>
                Try again
              </Button>
              <Button variant="ghost" size="sm" onClick={back}>
                Back
              </Button>
            </div>
          </div>
        )}
      >
        <Loading
          fallback={
            <div class="flex justify-center py-12">
              <Spinner size="sm" />
            </div>
          }
        >
          <Show
            when={source().status !== "missing"}
            fallback={
              <div class="flex flex-col items-center gap-3 py-12 text-center">
                <p class="text-sm text-muted-foreground">This item no longer exists.</p>
                <Button variant="outline" size="sm" onClick={back}>
                  Back to wishlist
                </Button>
              </div>
            }
          >
            <Show
              when={source().status === "wishlist" ? source().item : null}
              fallback={<WishForm addItem={saveWish} onSuccess={back} onCancel={back} />}
            >
              {(item) => (
                <WishForm addItem={saveWish} editItem={item()} onSuccess={back} onCancel={back} />
              )}
            </Show>
          </Show>
        </Loading>
      </Errored>
    </main>
  );
}
