import { createFileRoute } from "@tanstack/solid-router";
import { ShoppingBag } from "lucide-solid";

export const Route = createFileRoute("/haul")({
  component: HaulPage,
});

function HaulPage() {
  return (
    <div class="flex flex-col items-center justify-center py-20 text-muted-foreground">
      <ShoppingBag size={48} class="mb-4 opacity-40" />
      <p class="text-sm">Coming soon</p>
      <p class="mt-1 text-xs opacity-60">Haul feature is under development.</p>
    </div>
  );
}
