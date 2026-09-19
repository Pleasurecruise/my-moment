import { createFileRoute, useNavigate, useSearch } from "@tanstack/solid-router";
import { Errored, Loading, Show, createMemo } from "solid-js";
import { z } from "zod";
import { ArrowLeft, Clapperboard, Film } from "lucide-solid";
import { Button, Spinner, toast } from "@my-moment/ui";
import { MediaForm } from "~/modules/collection/MediaForm";
import { mediaItemSchema, mediaKindSchema, type MediaFormInput, type MediaItem } from "~/types";
import { privatePageMeta } from "~/lib/seo";

const mediaFormSearchSchema = z.object({
  kind: mediaKindSchema.default("anime"),
  edit: z.string().trim().min(1).optional(),
});

type SourceState =
  | { status: "create"; item: null }
  | { status: "missing"; item: null }
  | { status: "ready"; item: MediaItem };

export const Route = createFileRoute("/collection/add")({
  component: MediaFormPage,
  validateSearch: mediaFormSearchSchema,
  head: () => ({ meta: privatePageMeta("Add to Collection") }),
});

function MediaFormPage() {
  const search = useSearch({ from: "/collection/add" });
  const navigate = useNavigate({ from: "/collection/add" });

  const source = createMemo<SourceState>(async () => {
    const id = search().edit;
    if (!id) return { status: "create", item: null };
    const response = await fetch(`/api/media/${id}`);
    if (response.status === 404) return { status: "missing", item: null };
    if (response.status === 401 || response.status === 403) {
      throw new Error("You do not have permission to load this item.");
    }
    if (!response.ok) throw new Error(`Could not load this item (${response.status}).`);
    return { status: "ready", item: mediaItemSchema.parse(await response.json()) };
  });

  const back = () => navigate({ to: "/collection", search: { view: search().kind } });
  const save = async (data: MediaFormInput) => {
    const id = search().edit;
    const response = await fetch(id ? `/api/media/${id}` : "/api/media", {
      method: id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      toast.error("Failed to save item");
      return null;
    }
    toast.success(id ? "Item updated" : "Item added");
    return mediaItemSchema.parse(await response.json());
  };

  return (
    <main class="mx-auto max-w-2xl space-y-6">
      <div class="flex items-center gap-3">
        <Button variant="ghost" size="icon" class="size-8" onClick={back}>
          <ArrowLeft size={16} />
        </Button>
        <div class="flex items-center gap-2">
          {search().kind === "film" ? (
            <Film size={18} class="text-muted-foreground" />
          ) : (
            <Clapperboard size={18} class="text-muted-foreground" />
          )}
          <h1 class="text-lg font-semibold">
            {search().edit ? "Edit" : search().kind === "film" ? "Add a film" : "Add an anime"}
          </h1>
        </div>
      </div>

      <Errored
        fallback={(error, reset) => (
          <div class="flex flex-col items-center gap-3 py-12 text-center">
            <p class="text-sm text-destructive">{String(error())}</p>
            <div class="flex gap-2">
              <Button variant="outline" size="sm" onClick={reset}>
                Try again
              </Button>
              <Button variant="ghost" size="sm" onClick={back}>
                Back
              </Button>
            </div>
          </div>
        )}
      >
        <Loading
          fallback={
            <div class="flex justify-center py-12">
              <Spinner size="sm" />
            </div>
          }
        >
          <Show
            when={source().status !== "missing"}
            fallback={
              <div class="flex flex-col items-center gap-3 py-12 text-center">
                <p class="text-sm text-muted-foreground">This item no longer exists.</p>
                <Button variant="outline" size="sm" onClick={back}>
                  Back to collection
                </Button>
              </div>
            }
          >
            <Show
              when={source().status === "ready" ? source().item : null}
              fallback={
                <MediaForm kind={search().kind} addItem={save} onSuccess={back} onCancel={back} />
              }
            >
              {(item) => (
                <MediaForm
                  kind={item().kind}
                  addItem={save}
                  editItem={item()}
                  onSuccess={back}
                  onCancel={back}
                />
              )}
            </Show>
          </Show>
        </Loading>
      </Errored>
    </main>
  );
}
