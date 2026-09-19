import { createFileRoute, useNavigate, useSearch } from "@tanstack/solid-router";
import { Errored, Loading, Show, createMemo } from "solid-js";
import { z } from "zod";
import { ArrowLeft, ShoppingBag } from "lucide-solid";
import { Button, Spinner, toast } from "@my-moment/ui";
import { GoodsForm } from "~/modules/haul";
import {
  goodsItemSchema,
  wishItemSchema,
  type GoodsFormInput,
  type GoodsItem,
  type WishItem,
} from "~/types";
import { privatePageMeta } from "~/lib/seo";

const haulFormSearchSchema = z
  .object({
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
  });

type SourceState =
  | { status: "create"; item: null }
  | { status: "missing"; item: null }
  | { status: "haul"; item: GoodsItem }
  | { status: "wishlist"; item: WishItem };

export const Route = createFileRoute("/haul/add")({
  component: HaulFormPage,
  validateSearch: haulFormSearchSchema,
  head: () => ({ meta: privatePageMeta("Add to Haul") }),
});

function HaulFormPage() {
  const search = useSearch({ from: "/haul/add" });
  const navigate = useNavigate({ from: "/haul/add" });

  const source = createMemo<SourceState>(async () => {
    const current = search();
    if (current.convert) {
      const response = await fetch(`/api/wish/${current.convert}`);
      if (response.status === 404) return { status: "missing", item: null };
      if (response.status === 401 || response.status === 403) {
        throw new Error("You do not have permission to load this item.");
      }
      if (!response.ok) throw new Error(`Could not load this item (${response.status}).`);
      return { status: "wishlist", item: wishItemSchema.parse(await response.json()) };
    }
    if (current.edit) {
      const response = await fetch(`/api/haul/${current.edit}`);
      if (response.status === 404) return { status: "missing", item: null };
      if (response.status === 401 || response.status === 403) {
        throw new Error("You do not have permission to load this item.");
      }
      if (!response.ok) throw new Error(`Could not load this item (${response.status}).`);
      return { status: "haul", item: goodsItemSchema.parse(await response.json()) };
    }
    return { status: "create", item: null };
  });

  const converting = () => Boolean(search().convert);
  const haulInitial = createMemo<GoodsItem | undefined>(() => {
    const current = source();
    if (current.status === "haul") return current.item;
    if (current.status !== "wishlist" || !converting()) return;
    return {
      ...current.item,
      rating: "great",
      purchaseDate: new Date().toISOString().slice(0, 10),
      comment: "",
    };
  });

  const back = () => navigate({ to: "/haul" });
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
    return goodsItemSchema.parse(await response.json());
  };

  return (
    <main class="mx-auto max-w-2xl space-y-6">
      <div class="flex items-center gap-3">
        <Button variant="ghost" size="icon" class="size-8" onClick={back}>
          <ArrowLeft size={16} />
        </Button>
        <div class="flex items-center gap-2">
          <ShoppingBag size={18} class="text-muted-foreground" />
          <h1 class="text-lg font-semibold">
            {converting() ? "Mark as purchased" : search().edit ? "Edit item" : "Add to haul"}
          </h1>
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
                  Back to haul
                </Button>
              </div>
            }
          >
            <GoodsForm
              addItem={saveHaul}
              editItem={haulInitial()}
              onSuccess={back}
              onCancel={back}
            />
          </Show>
        </Loading>
      </Errored>
    </main>
  );
}
