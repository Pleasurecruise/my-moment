import { createFileRoute, useNavigate, useSearch } from "@tanstack/solid-router";
import { createResource, Show } from "solid-js";
import { z } from "zod";
import { ArrowLeft, Heart } from "lucide-solid";
import { Button, toast } from "@my-moment/ui";
import { WishForm } from "~/modules/haul/WishForm";
import type { WishFormData, WishItem } from "~/modules/haul/types";

export const Route = createFileRoute("/wish/add")({
  component: WishAddPage,
  validateSearch: z.object({
    edit: z.string().optional(),
  }),
});

function WishAddPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/wish/add" });
  const editId = () => search().edit;
  const isEditing = () => !!editId();

  const [editItem] = createResource(
    () => editId(),
    async (id) => {
      const res = await fetch(`/api/wish/${id}`);
      if (!res.ok) return null;
      return (await res.json()) as WishItem;
    },
  );

  const handleSubmit = async (data: WishFormData): Promise<WishItem | null> => {
    const id = editId();
    try {
      const res = await fetch(id ? `/api/wish/${id}` : "/api/wish", {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const item = (await res.json()) as WishItem;
        toast.success(id ? "Wish updated" : "Added to wishlist");
        return item;
      }

      toast.error("Failed to save item");
      return null;
    } catch (e) {
      console.error("Failed to save wish item:", e);
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
          <Heart size={18} class="text-muted-foreground" />
          <h1 class="text-lg font-semibold">{isEditing() ? "Edit Wish" : "Add to Wishlist"}</h1>
        </div>
      </div>

      <Show
        when={!isEditing() || editItem()}
        fallback={<p class="text-sm text-muted-foreground">Loading...</p>}
      >
        <WishForm
          addItem={handleSubmit}
          editItem={editItem() ?? undefined}
          onSuccess={() => navigate({ to: "/haul" })}
          onCancel={() => navigate({ to: "/haul" })}
        />
      </Show>
    </div>
  );
}
