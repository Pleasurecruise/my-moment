import { createFileRoute } from "@tanstack/solid-router";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <div class="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
      {/* ── Main column ── */}
      <div class="min-w-0">
        <p class="py-20 text-center text-sm text-muted-foreground">No moments yet.</p>
      </div>

      {/* ── Right rail (sticky, hidden on mobile) ── */}
      <aside class="hidden min-w-0 lg:block sticky top-8 self-start" />
    </div>
  );
}
