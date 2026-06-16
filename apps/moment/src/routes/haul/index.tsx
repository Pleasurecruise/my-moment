import { createFileRoute, useSearch } from "@tanstack/solid-router";
import { createResource } from "solid-js";
import { z } from "zod";
import { HaulPage } from "~/modules/haul";
import type { GoodsItem } from "~/modules/haul/types";

interface HaulResponse {
  items: GoodsItem[];
}

let haulCache: HaulResponse | undefined;

export const Route = createFileRoute("/haul/")({
  component: HaulRoute,
  validateSearch: z.object({
    item: z.string().optional(),
  }),
  head: () => ({
    meta: [
      { title: "Haul — My Moment" },
      { property: "og:title", content: "Haul — My Moment" },
      {
        property: "og:description",
        content: "Things I bought and what I think of them.",
      },
      { property: "og:image", content: "/api/og/haul" },
      { property: "og:url", content: "/haul" },
      { property: "og:type", content: "website" },
    ],
  }),
  staleTime: 0,
});

function HaulRoute() {
  const search = useSearch({ from: "/haul/" });
  const [haul, { refetch }] = createResource<HaulResponse>(
    async () => {
      const res = await fetch("/api/haul");
      if (!res.ok) {
        throw new Error(`Failed to fetch: ${res.status}`);
      }
      const data = (await res.json()) as HaulResponse;
      haulCache = data;
      return data;
    },
    { initialValue: haulCache },
  );

  return <HaulPage haul={haul} onRetry={() => refetch()} initialOpenItem={search().item} />;
}
