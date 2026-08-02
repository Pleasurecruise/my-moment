import { createFileRoute, redirect } from "@tanstack/solid-router";

export const Route = createFileRoute("/snapshot")({
  beforeLoad: () => {
    throw redirect({ to: "/messages", replace: true });
  },
});
