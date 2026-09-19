import { createFileRoute, useSearch } from "@tanstack/solid-router";
import { Errored, Loading, createMemo, refresh } from "solid-js";
import { z } from "zod";
import { Button, Spinner } from "@my-moment/ui";
import { EmptyState } from "~/components/EmptyState";
import { WishPage } from "~/modules/haul";
import type { WishItem } from "~/types";
import { publicPageMeta } from "~/lib/seo";

export const Route = createFileRoute("/wish/")({
  validateSearch: z.object({
    item: z.string().optional(),
  }),
  component: WishRoutePage,
  head: () => ({
    meta: publicPageMeta("wishlist"),
  }),
});

function WishRoutePage() {
  const search = useSearch({ from: "/wish/" });
  const wishes = createMemo<{ items: WishItem[] }>(async () => {
    const response = await fetch("/api/wish");
    if (!response.ok) throw new Error("Failed to load wishlist");
    return response.json();
  });

  return (
    <Errored
      fallback={(_, reset) => (
        <EmptyState
          title="Could not load wishlist"
          description="Your wishlist is temporarily unavailable."
          action={
            <Button variant="link" size="sm" onClick={reset}>
              Retry
            </Button>
          }
        />
      )}
    >
      <Loading
        fallback={
          <div class="flex items-center justify-center gap-2 py-20 text-muted-foreground">
            <Spinner size="sm" />
            <p class="text-sm">Loading...</p>
          </div>
        }
      >
        <main class="pb-10">
          <WishPage
            wishes={wishes}
            onRetry={() => refresh(wishes)}
            initialOpenItem={search().item}
          />
        </main>
      </Loading>
    </Errored>
  );
}
