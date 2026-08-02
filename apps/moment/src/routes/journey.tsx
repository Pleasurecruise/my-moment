import { createFileRoute } from "@tanstack/solid-router";
import { lazy } from "solid-js";

const JourneyMap = lazy(() =>
  import("~/modules/journey/JourneyMap").then((module) => ({ default: module.JourneyMap })),
);

export const Route = createFileRoute("/journey")({
  component: JourneyPage,
  head: () => ({
    meta: [
      { title: "Journey — My Moment" },
      { property: "og:title", content: "Journey — My Moment" },
      { property: "og:description", content: "A map of places that became part of the story." },
      { property: "og:url", content: "/journey" },
    ],
  }),
});

function JourneyPage() {
  return <JourneyMap />;
}
