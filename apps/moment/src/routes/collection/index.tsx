import { createFileRoute, useNavigate, useSearch } from "@tanstack/solid-router";
import { Match, Switch, createResource } from "solid-js";
import { z } from "zod";
import { Segment } from "~/components/Segment";
import { HaulPage, WishPage } from "~/modules/haul";
import type { CollectionResponse, GoodsItem, WishItem } from "~/types";

export const Route = createFileRoute("/collection/")({
  component: CollectionPage,
  validateSearch: z.object({
    view: z.enum(["haul", "wishlist"]).catch("haul"),
    item: z.string().optional(),
  }),
  head: () => ({
    meta: [
      { title: "Collection — My Moment" },
      { property: "og:title", content: "Collection — My Moment" },
      { property: "og:description", content: "Things collected, considered, and remembered." },
      { property: "og:image", content: "/api/og/collection" },
      { property: "og:url", content: "/collection" },
    ],
  }),
});

function CollectionPage() {
  const search = useSearch({ from: "/collection/" });
  const navigate = useNavigate({ from: "/collection/" });
  const [haul, haulActions] = createResource<CollectionResponse<GoodsItem>>(async () => {
    const response = await fetch("/api/haul");
    if (!response.ok) throw new Error("Failed to load haul");
    return response.json();
  });
  const [wishes, wishActions] = createResource<CollectionResponse<WishItem>>(async () => {
    const response = await fetch("/api/wish");
    if (!response.ok) throw new Error("Failed to load wishlist");
    return response.json();
  });

  const options = () => [
    { value: "haul" as const, label: `Haul ${haul()?.items.length ?? "—"}` },
    { value: "wishlist" as const, label: `Wishlist ${wishes()?.items.length ?? "—"}` },
  ];
  const viewSwitcher = () => (
    <Segment
      options={options()}
      value={search().view}
      onChange={(view) => navigate({ search: { view }, replace: true })}
    />
  );

  return (
    <main class="pb-10">
      <Switch>
        <Match when={search().view === "haul"}>
          <HaulPage
            haul={haul}
            onRetry={() => haulActions.refetch()}
            initialOpenItem={search().item}
            viewSwitcher={viewSwitcher()}
          />
        </Match>
        <Match when={search().view === "wishlist"}>
          <WishPage
            wishes={wishes}
            onRetry={() => wishActions.refetch()}
            initialOpenItem={search().item}
            viewSwitcher={viewSwitcher()}
          />
        </Match>
      </Switch>
    </main>
  );
}
