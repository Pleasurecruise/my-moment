import { createFileRoute } from "@tanstack/solid-router";
import { Camera } from "lucide-solid";

export const Route = createFileRoute("/snapshot")({
  component: SnapshotPage,
});

function SnapshotPage() {
  return (
    <div class="flex flex-col items-center justify-center py-20 text-muted-foreground">
      <Camera size={48} class="mb-4 opacity-40" />
      <p class="text-sm">Coming soon</p>
      <p class="mt-1 text-xs opacity-60">Snapshot feature is under development.</p>
    </div>
  );
}
