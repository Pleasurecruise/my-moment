import { createFileRoute, redirect } from "@tanstack/solid-router";
import { z } from "zod";

export const Route = createFileRoute("/wish/")({
  validateSearch: z.object({
    item: z.string().optional(),
  }),
  beforeLoad: ({ search }) => {
    throw redirect({
      to: "/collection",
      search: { view: "wishlist", item: search.item },
      replace: true,
    });
  },
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
