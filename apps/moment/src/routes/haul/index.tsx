import { createFileRoute } from "@tanstack/solid-router";
import { createResource, onMount } from "solid-js";
import { HaulPage } from "~/modules/haul";
import type { GoodsItem } from "~/modules/haul/types";

interface HaulResponse {
  items: GoodsItem[];
}

export const Route = createFileRoute("/haul/")({
  component: HaulRoute,
  staleTime: 0,
});

function HaulRoute() {
  const [haul, { refetch }] = createResource<HaulResponse>(async () => {
    const res = await fetch("/api/haul");
    if (!res.ok) {
      throw new Error(`Failed to fetch: ${res.status}`);
    }
    return res.json();
  });

  onMount(() => {
    refetch();
  });

  return <HaulPage haul={haul} onRetry={() => refetch()} />;
}
