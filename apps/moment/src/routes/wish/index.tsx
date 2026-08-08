import { createFileRoute, redirect } from "@tanstack/solid-router";
import { z } from "zod";
import { publicPageMeta } from "~/lib/seo";

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
    meta: publicPageMeta("wishlist"),
  }),
  staleTime: 0,
});
