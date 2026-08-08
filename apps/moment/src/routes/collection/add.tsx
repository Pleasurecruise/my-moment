import { createFileRoute, useNavigate, useSearch } from "@tanstack/solid-router";
import { Match, Show, Switch, createMemo, createResource } from "solid-js";
import { z } from "zod";
import { ArrowLeft, Heart, ShoppingBag } from "lucide-solid";
import { Button, Spinner, toast } from "@my-moment/ui";
import { GoodsForm, WishForm } from "~/modules/haul";
import type { GoodsFormInput, GoodsItem, WishFormInput, WishItem } from "~/types";
import { privatePageMeta } from "~/lib/seo";

const collectionFormSearchSchema = z
  .object({
    view: z.enum(["haul", "wishlist"]).default("haul"),
    edit: z.string().trim().min(1).optional(),
    convert: z.string().trim().min(1).optional(),
  })
  .superRefine((search, context) => {
    if (search.edit && search.convert) {
      context.addIssue({
        code: "custom",
        message: "edit and convert cannot be used together",
        path: ["convert"],
      });
    }
    if (search.convert && search.view !== "haul") {
      context.addIssue({
        code: "custom",
        message: "wishlist items can only be converted into haul items",
        path: ["view"],
      });
    }
  });

interface SourceRequest {
  id: string;
  kind: "haul" | "wishlist";
}

export const Route = createFileRoute("/collection/add")({
  component: CollectionFormPage,
  validateSearch: collectionFormSearchSchema,
  head: () => ({ meta: privatePageMeta("Edit Collection") }),
});

function CollectionFormPage() {
  const search = useSearch({ from: "/collection/add" });
  const navigate = useNavigate({ from: "/collection/add" });
  const sourceRequest = createMemo<SourceRequest | null>(() => {
    const current = search();
    if (current.convert) return { id: current.convert, kind: "wishlist" };
    if (current.edit) return { id: current.edit, kind: current.view };
    return null;
  });
  const [source, { refetch }] = createResource(sourceRequest, async (request) => {
    const endpoint = request.kind === "wishlist" ? "/api/wish" : "/api/haul";
    const response = await fetch(`${endpoint}/${request.id}`);
    if (response.status === 404) return null;
    if (response.status === 401 || response.status === 403) {
      throw new Error("You do not have permission to load this item.");
    }
    if (!response.ok) throw new Error(`Could not load this item (${response.status}).`);
    return response.json() as Promise<GoodsItem | WishItem>;
  });
  const converting = () => Boolean(search().convert);
  const haulInitial = createMemo<GoodsItem | undefined>(() => {
    const item = source();
    if (!item || !converting()) return item as GoodsItem | undefined;
    const wish = item as WishItem;
    return {
      ...wish,
      rating: "great",
      purchaseDate: new Date().toISOString().slice(0, 10),
      comment: "",
    };
  });

  const back = () => navigate({ to: "/collection", search: { view: search().view } });
  const saveHaul = async (data: GoodsFormInput) => {
    const id = search().edit;
    const url = converting()
      ? `/api/wish/${search().convert}/convert`
      : id
        ? `/api/haul/${id}`
        : "/api/haul";
    const response = await fetch(url, {
      method: converting() || !id ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      toast.error("Failed to save item");
      return null;
    }
    toast.success(converting() ? "Moved to your haul" : id ? "Item updated" : "Item added");
    return response.json() as Promise<GoodsItem>;
  };
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
    return response.json() as Promise<WishItem>;
  };

  return (
    <main class="mx-auto max-w-2xl space-y-6">
      <div class="flex items-center gap-3">
        <Button variant="ghost" size="icon" class="size-8" onClick={back}>
          <ArrowLeft size={16} />
        </Button>
        <div class="flex items-center gap-2">
          <Show
            when={search().view === "haul"}
            fallback={<Heart size={18} class="text-muted-foreground" />}
          >
            <ShoppingBag size={18} class="text-muted-foreground" />
          </Show>
          <h1 class="text-lg font-semibold">
            {converting()
              ? "Mark as purchased"
              : search().edit
                ? "Edit item"
                : search().view === "haul"
                  ? "Add to haul"
                  : "Add a wish"}
          </h1>
        </div>
      </div>
      <Switch
        fallback={
          <Show
            when={search().view === "haul"}
            fallback={
              <WishForm
                addItem={saveWish}
                editItem={source() as WishItem | undefined}
                onSuccess={back}
                onCancel={back}
              />
            }
          >
            <GoodsForm
              addItem={saveHaul}
              editItem={haulInitial()}
              onSuccess={back}
              onCancel={back}
            />
          </Show>
        }
      >
        <Match when={sourceRequest() && source.loading}>
          <div class="flex justify-center py-12">
            <Spinner size="sm" />
          </div>
        </Match>
        <Match when={sourceRequest() && source.error}>
          <div class="flex flex-col items-center gap-3 py-12 text-center">
            <p class="text-sm text-destructive">
              {source.error instanceof Error ? source.error.message : "Could not load this item."}
            </p>
            <div class="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => void refetch()}>
                Try again
              </Button>
              <Button variant="ghost" size="sm" onClick={back}>
                Back
              </Button>
            </div>
          </div>
        </Match>
        <Match when={sourceRequest() && source() === null}>
          <div class="flex flex-col items-center gap-3 py-12 text-center">
            <p class="text-sm text-muted-foreground">This item no longer exists.</p>
            <Button variant="outline" size="sm" onClick={back}>
              Back to collection
            </Button>
          </div>
        </Match>
      </Switch>
    </main>
  );
}
