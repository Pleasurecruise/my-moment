import { Errored, Loading, Show, createMemo } from "solid-js";
import { ExternalLink, Music2 } from "lucide-solid";
import { Button, Spinner } from "@my-moment/ui";
import { EmptyState } from "~/components/EmptyState";
import type { MusicResponse } from "~/types";

export function MusicView() {
  const music = createMemo<MusicResponse>(async () => {
    const response = await fetch("/api/music");
    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(data?.error || "Failed to load music");
    }
    return response.json();
  });

  return (
    <Errored
      fallback={(error, reset) => (
        <EmptyState
          title="Could not load music"
          description={String(error())}
          action={
            <Button variant="link" size="sm" onClick={reset}>
              Retry
            </Button>
          }
        />
      )}
    >
      <Loading
        fallback={
          <div class="flex items-center justify-center gap-2 py-20 text-muted-foreground">
            <Spinner size="sm" />
            <p class="text-sm">Loading...</p>
          </div>
        }
      >
        <section
          class="mx-auto flex h-full min-h-0 w-full max-w-[70rem] flex-col overflow-hidden border-y border-border bg-transparent"
          aria-label="Spotify playlist"
        >
          <div class="flex shrink-0 flex-wrap items-center gap-3 border-b border-border px-4 py-3 sm:px-8">
            <div class="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
              <Show
                when={music().coverUrl}
                fallback={<Music2 size={24} class="text-muted-foreground" aria-hidden="true" />}
              >
                <img src={music().coverUrl} alt="" class="h-full w-full object-cover" />
              </Show>
            </div>
            <div class="min-w-0 flex-1">
              <h2 class="truncate text-sm font-semibold text-foreground">{music().name}</h2>
              <p class="text-xs text-muted-foreground">Spotify playlist</p>
            </div>
            <a
              href={music().spotifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              class="flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ExternalLink size={13} aria-hidden="true" />
              Open in Spotify
            </a>
          </div>

          <iframe
            src={music().iframeUrl}
            title={music().name}
            frameborder="0"
            allowfullscreen
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            class="min-h-0 w-full flex-1 border-0 bg-transparent"
          />
        </section>
      </Loading>
    </Errored>
  );
}
