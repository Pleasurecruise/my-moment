import { For, Show, createSignal, onCleanup, onMount } from "solid-js";
import mapboxgl from "mapbox-gl";
import MapboxLanguage from "@mapbox/mapbox-gl-language";
import { parse } from "yaml";
import { Globe2, LocateFixed, Map as MapIcon } from "lucide-solid";
import { Button, Spinner, cn } from "@my-moment/ui";
import { PageHeader } from "~/components/PageHeader";
import rawJourneyData from "./data.yaml?raw";
import type { JourneyGroup, JourneyMarkerEntry, JourneyProjection } from "~/types";
import "mapbox-gl/dist/mapbox-gl.css";

const PROJECTION_KEY = "my-moment:journey-projection";
const MAPBOX_TOKEN =
  "pk.eyJ1IjoicGxlYXN1cmUxMjM0IiwiYSI6ImNtazJ2MXFwZDBiaDUzY3M4aXhnNGRxaWwifQ.v_BxUgGMO-diXUrd_juyQw";

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

export function JourneyMap() {
  const groups = readGroups();
  let container!: HTMLDivElement;
  let map: mapboxgl.Map | undefined;
  let observer: MutationObserver | undefined;
  let locationMarker: mapboxgl.Marker | undefined;
  let loadTimeout: number | undefined;
  let lastLoadError = "";
  const markers: JourneyMarkerEntry[] = [];
  const [enabled, setEnabled] = createSignal(
    new Set(
      groups
        .filter((group) => ["Visited", "Stay", "Residence"].includes(group.label))
        .map((group) => group.label),
    ),
  );
  const [projection, setProjection] = createSignal<JourneyProjection>("globe");
  const [ready, setReady] = createSignal(false);
  const [error, setError] = createSignal("");
  const [locating, setLocating] = createSignal(false);
  const [locationStatus, setLocationStatus] = createSignal("");
  const totalPlaces = groups.reduce((total, group) => total + group.places.length, 0);

  const styleForTheme = () =>
    document.documentElement.classList.contains("dark")
      ? "mapbox://styles/mapbox/dark-v10"
      : "mapbox://styles/mapbox/light-v10";

  const setMapProjection = (next: JourneyProjection) => {
    setProjection(next);
    localStorage.setItem(PROJECTION_KEY, next);
    map?.setProjection(next);
  };

  const resizeMap = () => map?.resize();

  const toggleGroup = (label: string) => {
    setEnabled((current) => {
      const next = new Set(current);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      for (const item of markers) {
        if (item.group === label)
          item.marker.getElement().style.display = next.has(label) ? "" : "none";
      }
      return next;
    });
  };

  const locate = () => {
    if (!navigator.geolocation) {
      setLocationStatus("Location is not supported by this browser.");
      return;
    }
    setLocating(true);
    setLocationStatus("Requesting your location…");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (!map) return;
        locationMarker?.remove();
        const dot = document.createElement("div");
        dot.className = "journey-location-dot";
        dot.setAttribute("aria-label", "Your current location");
        locationMarker = new mapboxgl.Marker({ element: dot })
          .setLngLat([coords.longitude, coords.latitude])
          .addTo(map);
        map.flyTo({ center: [coords.longitude, coords.latitude], zoom: 6, essential: true });
        setLocationStatus("Location found.");
        setLocating(false);
      },
      (reason) => {
        setLocationStatus(
          reason.code === reason.PERMISSION_DENIED
            ? "Location permission was denied."
            : "Your location could not be determined.",
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 60_000 },
    );
  };

  onMount(() => {
    const saved = localStorage.getItem(PROJECTION_KEY);
    const initialProjection: JourneyProjection = saved === "mercator" ? "mercator" : "globe";
    setProjection(initialProjection);
    mapboxgl.accessToken = MAPBOX_TOKEN;
    try {
      map = new mapboxgl.Map({
        container,
        style: styleForTheme(),
        center: [100, 30],
        zoom: 2,
        minZoom: 0.7,
        projection: initialProjection,
        attributionControl: false,
        dragRotate: true,
        touchPitch: true,
      });
      map.on("error", (event) => {
        const message = event.error?.message || "";
        if (/events\.mapbox\.com|telemetry|ERR_BLOCKED_BY_CLIENT/i.test(message)) return;
        lastLoadError = message;
      });
      loadTimeout = window.setTimeout(() => {
        if (!ready()) {
          setError(
            lastLoadError ||
              "The map style did not finish loading. Check Mapbox access and WebGL support.",
          );
        }
      }, 15_000);
      map.on("load", () => {
        if (loadTimeout !== undefined) window.clearTimeout(loadTimeout);
        setReady(true);
        map?.zoomIn();
        requestAnimationFrame(() => map?.resize());
      });
      map.on("style.load", () => {
        map?.setProjection(projection());
        if (projection() === "globe") {
          map?.setFog({
            color: "rgba(0,0,0,0)",
            "high-color": "rgba(255,255,255,0.1)",
            "space-color": "rgba(0,0,0,0)",
            "horizon-blend": 0,
          });
        }
      });
      window.addEventListener("resize", resizeMap);
      requestAnimationFrame(resizeMap);
      try {
        map.addControl(new MapboxLanguage({ defaultLanguage: "en" }));
      } catch (reason) {
        console.warn("Map language control could not be enabled:", reason);
      }
      map.on("load", () => {
        for (const group of groups) {
          for (const place of group.places) {
            const button = document.createElement("button");
            button.type = "button";
            button.className = `journey-marker${place.current ? " is-current" : ""}`;
            button.style.display = enabled().has(group.label) ? "" : "none";
            button.style.setProperty("--marker-color", group.color);
            button.style.setProperty(
              "--marker-size",
              `${place.current ? 16 : Math.max(10, (place.size ?? 0.08) * 120)}px`,
            );
            button.setAttribute("aria-label", `${place.label}, ${group.label}`);
            button.tabIndex = 0;
            const dot = document.createElement("span");
            dot.className = "journey-marker-dot";
            dot.setAttribute("aria-hidden", "true");
            button.appendChild(dot);
            const popup = new mapboxgl.Popup({
              offset: 8,
              closeButton: false,
              closeOnClick: false,
              closeOnMove: false,
              focusAfterOpen: false,
            });
            const marker = new mapboxgl.Marker({ element: button, anchor: "center" })
              .setLngLat(place.coords)
              .addTo(map!);
            const open = () => popup.setLngLat(place.coords).setText(place.label).addTo(map!);
            const close = () => popup.remove();
            button.addEventListener("mouseenter", open);
            button.addEventListener("mouseleave", close);
            button.addEventListener("focus", open);
            button.addEventListener("blur", close);
            button.addEventListener("click", (event) => {
              event.stopPropagation();
              open();
            });
            button.addEventListener("keydown", (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                event.stopPropagation();
                open();
              } else if (event.key === "Escape") {
                close();
              }
            });
            map!.on("click", close);
            markers.push({ group: group.label, marker });
          }
        }
      });
      observer = new MutationObserver(() => map?.setStyle(styleForTheme()));
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The map failed to start.");
    }
  });

  onCleanup(() => {
    if (loadTimeout !== undefined) window.clearTimeout(loadTimeout);
    observer?.disconnect();
    window.removeEventListener("resize", resizeMap);
    locationMarker?.remove();
    for (const item of markers) item.marker.remove();
    markers.length = 0;
    map?.remove();
    map = undefined;
  });

  return (
    <main class="flex h-full min-h-0 flex-col">
      <div class="mx-auto w-full max-w-[70rem] shrink-0 px-4 sm:px-8">
        <PageHeader
          title="Journey"
          subtitle={
            <>
              {totalPlaces} place{totalPlaces !== 1 ? "s" : ""} mapped
            </>
          }
          class="mb-4"
        />
      </div>

      <section class="journey-shell relative mx-auto min-h-0 w-full max-w-[70rem] flex-1 overflow-hidden border-y border-border bg-muted/30">
        <div
          ref={(element) => {
            container = element;
          }}
          class="h-full w-full"
          style={{ width: "100%", height: "100%" }}
          aria-label="Journey map"
        />

        <Show when={!ready() && !error()}>
          <div class="pointer-events-none absolute bottom-3 right-3 z-20 flex items-center gap-2 rounded-lg border border-border bg-background/90 px-3 py-2 text-xs text-muted-foreground shadow-md backdrop-blur-md">
            <Spinner size="sm" /> Loading map…
          </div>
        </Show>
        <Show when={error()}>
          <div class="pointer-events-none absolute bottom-3 right-3 z-20 max-w-sm rounded-lg border border-destructive/30 bg-background/90 px-3 py-2 text-xs text-destructive shadow-md backdrop-blur-md">
            {error()}
          </div>
        </Show>

        <div class="absolute bottom-6 right-3 z-20 flex max-w-[calc(100%-1.5rem)] flex-col items-end gap-2 sm:right-6">
          <div class="flex gap-2">
            <div class="inline-flex rounded-full border border-white/20 bg-background/75 p-1 shadow-lg backdrop-blur-md">
              <Button
                variant="ghost"
                size="icon"
                class={cn("size-8 rounded-full", projection() !== "globe" && "opacity-35")}
                onClick={() => setMapProjection("globe")}
                aria-label="Globe projection"
              >
                <Globe2 size={16} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                class={cn("size-8 rounded-full", projection() !== "mercator" && "opacity-35")}
                onClick={() => setMapProjection("mercator")}
                aria-label="Flat map projection"
              >
                <MapIcon size={16} />
              </Button>
            </div>
            <Button
              variant="ghost"
              size="icon"
              class="size-10 rounded-full border border-white/20 bg-background/75 shadow-lg backdrop-blur-md"
              onClick={locate}
              disabled={locating() || !ready()}
              aria-label="Locate me"
            >
              <Show when={!locating()} fallback={<Spinner size="sm" />}>
                <LocateFixed size={17} />
              </Show>
            </Button>
          </div>
          <Show when={locationStatus()}>
            <p class="max-w-52 rounded-full bg-background/75 px-3 py-1.5 text-[10px] text-muted-foreground shadow backdrop-blur-md">
              {locationStatus()}
            </p>
          </Show>
          <div class="flex max-w-full items-center gap-3 overflow-x-auto rounded-full border border-white/20 bg-background/75 px-3 py-2 text-xs shadow-lg backdrop-blur-md">
            <For each={groups}>
              {(group) => (
                <button
                  type="button"
                  aria-pressed={enabled().has(group.label)}
                  onClick={() => toggleGroup(group.label)}
                  class={cn(
                    "flex shrink-0 items-center gap-1.5 whitespace-nowrap transition-opacity",
                    !enabled().has(group.label) && "opacity-30",
                  )}
                >
                  <span
                    class="size-2.5 rounded-full border-2 border-white shadow-[0_0_0_2px_rgba(17,24,39,0.08)] dark:shadow-[0_0_0_2px_rgba(255,255,255,0.19)]"
                    style={{ background: group.color }}
                  />
                  {group.label}
                </button>
              )}
            </For>
          </div>
        </div>
      </section>
    </main>
  );
}
