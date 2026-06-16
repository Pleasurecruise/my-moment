import { createFileRoute, useSearch } from "@tanstack/solid-router";
import { createResource } from "solid-js";
import { z } from "zod";
import { WishPage } from "~/modules/haul/WishPage";
import type { WishItem } from "~/modules/haul/types";

interface WishResponse {
  items: WishItem[];
}

let wishCache: WishResponse | undefined;

export const Route = createFileRoute("/wish/")({
  component: WishRoute,
  validateSearch: z.object({
    item: z.string().optional(),
  }),
  head: () => ({
    meta: [
      { title: "Wishlist — My Moment" },
      { property: "og:title", content: "Wishlist — My Moment" },
      { property: "og:description", content: "Things I'm hoping to get." },
      { property: "og:image", content: "/api/og/wishlist" },
      { property: "og:url", content: "/wish" },
      { property: "og:type", content: "website" },
    ],
  }),
  staleTime: 0,
});

function WishRoute() {
  const search = useSearch({ from: "/wish/" });
  const [wishes, { refetch }] = createResource<WishResponse>(
    async () => {
      const res = await fetch("/api/wish");
      if (!res.ok) {
        throw new Error(`Failed to fetch: ${res.status}`);
      }
      const data = (await res.json()) as WishResponse;
      wishCache = data;
      return data;
    },
    { initialValue: wishCache },
  );

  return <WishPage wishes={wishes} onRetry={() => refetch()} initialOpenItem={search().item} />;
}
