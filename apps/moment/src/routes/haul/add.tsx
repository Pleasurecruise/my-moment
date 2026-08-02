import { createFileRoute, redirect } from "@tanstack/solid-router";
import { z } from "zod";

export const Route = createFileRoute("/haul/add")({
  validateSearch: z.object({ edit: z.string().optional() }),
  beforeLoad: ({ search }) => {
    throw redirect({
      to: "/collection/add",
      search: { view: "haul", edit: search.edit },
      replace: true,
    });
  },
});
