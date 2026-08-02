import { createFileRoute, redirect } from "@tanstack/solid-router";
import { z } from "zod";

export const Route = createFileRoute("/haul/")({
  validateSearch: z.object({
    item: z.string().optional(),
  }),
  beforeLoad: ({ search }) => {
    throw redirect({
      to: "/collection",
      search: { view: "haul", item: search.item },
      replace: true,
    });
  },
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
