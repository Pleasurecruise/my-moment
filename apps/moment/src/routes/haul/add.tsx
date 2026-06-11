import { createFileRoute, useNavigate } from "@tanstack/solid-router";
import { ArrowLeft, ShoppingBag } from "lucide-solid";
import { Button, toast } from "@my-moment/ui";
import { GoodsForm } from "~/modules/haul/GoodsForm";
import type { GoodsFormData, GoodsItem } from "~/modules/haul/types";

export const Route = createFileRoute("/haul/add")({
  component: HaulAddPage,
});

function HaulAddPage() {
  const navigate = useNavigate();

  const addItem = async (data: GoodsFormData): Promise<GoodsItem | null> => {
    try {
      const res = await fetch("/api/haul", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const item = (await res.json()) as GoodsItem;
        toast.success("Item added successfully");
        return item;
      }

      toast.error("Failed to add item");
      return null;
    } catch (e) {
      console.error("Failed to create haul item:", e);
      toast.error("Failed to add item");
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
          <h1 class="text-lg font-semibold">Add Item ✨</h1>
        </div>
      </div>

      <GoodsForm
        addItem={addItem}
        onSuccess={() => navigate({ to: "/haul" })}
        onCancel={() => navigate({ to: "/haul" })}
      />
    </div>
  );
}
