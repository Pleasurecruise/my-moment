import { createFileRoute, redirect } from "@tanstack/solid-router";
import { z } from "zod";

export const Route = createFileRoute("/wish/add")({
  validateSearch: z.object({ edit: z.string().optional() }),
  beforeLoad: ({ search }) => {
    throw redirect({
      to: "/collection/add",
      search: { view: "wishlist", edit: search.edit },
      replace: true,
    });
  },
});
