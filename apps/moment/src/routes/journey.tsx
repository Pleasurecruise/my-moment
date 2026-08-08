import { createFileRoute } from "@tanstack/solid-router";
import { lazy } from "solid-js";
import { publicPageMeta } from "~/lib/seo";

const JourneyMap = lazy(() =>
  import("~/modules/journey/JourneyMap").then((module) => ({ default: module.JourneyMap })),
);

export const Route = createFileRoute("/journey")({
  component: JourneyPage,
  head: () => ({
    meta: publicPageMeta("journey"),
  }),
});

function JourneyPage() {
  return <JourneyMap />;
}
