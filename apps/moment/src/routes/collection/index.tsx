import { createFileRoute, useNavigate, useSearch } from "@tanstack/solid-router";
import { Errored, Loading, Match, Switch, createMemo, refresh } from "solid-js";
import { z } from "zod";
import { Button, Spinner } from "@my-moment/ui";
import { Segment, type SegmentOption } from "~/components/Segment";
import { EmptyState } from "~/components/EmptyState";
import { HaulPage, WishPage } from "~/modules/haul";
import type { CollectionResponse, GoodsItem, WishItem } from "~/types";
import { publicPageMeta } from "~/lib/seo";

const collectionViewSchema = z.enum(["haul", "wishlist"]);
type CollectionView = z.infer<typeof collectionViewSchema>;

export const Route = createFileRoute("/collection/")({
  component: CollectionPage,
  validateSearch: z.object({
    view: collectionViewSchema.catch("haul"),
    item: z.string().optional(),
  }),
  head: () => ({
    meta: publicPageMeta("collection"),
  }),
});

function CollectionPage() {
  const search = useSearch({ from: "/collection/" });
  const navigate = useNavigate({ from: "/collection/" });
  const haul = createMemo<CollectionResponse<GoodsItem>>(async () => {
    const response = await fetch("/api/haul");
    if (!response.ok) throw new Error("Failed to load haul");
    return response.json();
  });
  const wishes = createMemo<CollectionResponse<WishItem>>(async () => {
    const response = await fetch("/api/wish");
    if (!response.ok) throw new Error("Failed to load wishlist");
    return response.json();
  });

  const options = (): SegmentOption<CollectionView>[] => [
    { value: "haul", label: `Haul ${haul()?.items.length ?? "—"}` },
    { value: "wishlist", label: `Wishlist ${wishes()?.items.length ?? "—"}` },
  ];
  const viewSwitcher = () => (
    <Segment
      options={options()}
      value={search().view}
      onChange={(view) => navigate({ search: { view }, replace: true })}
    />
  );

  return (
    <Errored
      fallback={(_, reset) => (
        <EmptyState
          title="Could not load collection"
          description="The collection is temporarily unavailable."
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
          <Switch>
            <Match when={search().view === "haul"}>
              <HaulPage
                haul={haul}
                onRetry={() => refresh(haul)}
                initialOpenItem={search().item}
                viewSwitcher={viewSwitcher()}
              />
            </Match>
            <Match when={search().view === "wishlist"}>
              <WishPage
                wishes={wishes}
                onRetry={() => refresh(wishes)}
                initialOpenItem={search().item}
                viewSwitcher={viewSwitcher()}
              />
            </Match>
          </Switch>
        </main>
      </Loading>
    </Errored>
  );
}
