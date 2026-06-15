import { createFileRoute, useNavigate, useSearch } from "@tanstack/solid-router";
import { createResource, Show } from "solid-js";
import { z } from "zod";
import { ArrowLeft, ShoppingBag } from "lucide-solid";
import { Button, Spinner, toast } from "@my-moment/ui";
import { GoodsForm } from "~/modules/haul/GoodsForm";
import type { GoodsFormData, GoodsItem } from "~/modules/haul/types";

export const Route = createFileRoute("/haul/add")({
  component: HaulAddPage,
  validateSearch: z.object({
    edit: z.string().optional(),
  }),
});

function HaulAddPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/haul/add" });
  const editId = () => search().edit;
  const isEditing = () => !!editId();

  const [editItem] = createResource(
    () => editId(),
    async (id) => {
      const res = await fetch(`/api/haul/${id}`);
      if (!res.ok) return null;
      return (await res.json()) as GoodsItem;
    },
  );

  const handleSubmit = async (data: GoodsFormData): Promise<GoodsItem | null> => {
    const id = editId();
    try {
      const res = await fetch(id ? `/api/haul/${id}` : "/api/haul", {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const item = (await res.json()) as GoodsItem;
        toast.success(id ? "Item updated" : "Item added successfully");
        return item;
      }

      toast.error("Failed to save item");
      return null;
    } catch (e) {
      console.error("Failed to save haul item:", e);
      toast.error("Failed to save item");
      return null;
    }
  };

  return (
    <div class="mx-auto max-w-2xl space-y-6">
      <div class="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          class="size-8"
          onClick={() => navigate({ to: "/haul" })}
        >
          <ArrowLeft size={16} />
        </Button>
        <div class="flex items-center gap-2">
          <ShoppingBag size={18} class="text-muted-foreground" />
          <h1 class="text-lg font-semibold">{isEditing() ? "Edit Item" : "Add Item"} ✨</h1>
        </div>
      </div>

      <Show
        when={!isEditing() || editItem()}
        fallback={
          <div class="flex items-center gap-2 text-muted-foreground">
            <Spinner size="sm" />
            <p class="text-sm">Loading...</p>
          </div>
        }
      >
        <GoodsForm
          addItem={handleSubmit}
          editItem={editItem() ?? undefined}
          onSuccess={() => navigate({ to: "/haul" })}
          onCancel={() => navigate({ to: "/haul" })}
        />
      </Show>
    </div>
  );
}
