import { createFileRoute } from "@tanstack/solid-router";
import { createResource, onMount } from "solid-js";
import { HaulPage } from "~/modules/haul";
import type { GoodsItem } from "~/modules/haul/types";
import type { WishItem } from "~/modules/haul/types";

interface HaulResponse {
  items: GoodsItem[];
}

interface WishResponse {
  items: WishItem[];
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

  const [wishes, { refetch: refetchWishes }] = createResource<WishResponse>(async () => {
    const res = await fetch("/api/wish");
    if (!res.ok) {
      throw new Error(`Failed to fetch: ${res.status}`);
    }
    return res.json();
  });

  onMount(() => {
    refetch();
    refetchWishes();
  });

  return (
    <HaulPage
      haul={haul}
      wishes={wishes}
      onRetry={() => refetch()}
      onWishRetry={() => refetchWishes()}
    />
  );
}
