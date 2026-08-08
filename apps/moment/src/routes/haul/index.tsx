import { createFileRoute, redirect } from "@tanstack/solid-router";
import { z } from "zod";
import { publicPageMeta } from "~/lib/seo";

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
    meta: publicPageMeta("haul"),
  }),
  staleTime: 0,
});
