import { createFileRoute } from "@tanstack/solid-router";
import { Camera } from "lucide-solid";

export const Route = createFileRoute("/snapshot")({
  component: SnapshotPage,
});

function SnapshotPage() {
  return (
    <div>
      <div class="mb-6">
        <h2 class="text-lg font-semibold text-foreground">Snapshot</h2>
        <p class="mt-1 text-sm text-muted-foreground">Coming soon</p>
      </div>

      <div class="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Camera class="mb-4 h-12 w-12 opacity-40" />
        <p class="text-sm">Coming soon</p>
        <p class="mt-1 text-xs opacity-60">Snapshot feature is under development.</p>
      </div>
    </div>
  );
}
