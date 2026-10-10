import { parse } from "yaml";
import rawJourneyData from "./data.yaml?raw";
import type { JourneyGroup } from "~/types";

export const DEFAULT_GROUPS = ["Visited", "Stay", "Residence"];

function readGroups(): JourneyGroup[] {
  const value = parse(rawJourneyData) as unknown;
  if (!Array.isArray(value)) return [];
  return value.filter((group): group is JourneyGroup =>
    Boolean(
      group &&
      typeof group === "object" &&
      "label" in group &&
      "color" in group &&
      "places" in group,
    ),
  );
}

export const groups = readGroups();
