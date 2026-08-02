import type { Marker } from "mapbox-gl";

export interface JourneyPlace {
  label: string;
  coords: [number, number];
  size?: number;
  current?: boolean;
}

export interface JourneyGroup {
  label: string;
  color: string;
  places: JourneyPlace[];
}

export type JourneyProjection = "globe" | "mercator";

export interface JourneyMarkerEntry {
  group: string;
  marker: Marker;
}
