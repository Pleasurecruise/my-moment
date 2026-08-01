import { createFileRoute, useNavigate } from "@tanstack/solid-router";
import { createEffect, createResource, createSignal, Show } from "solid-js";
import { ArrowLeft, Save } from "lucide-solid";
import { Button, Input, Textarea, TagInput, Label, Spinner, toast } from "@my-moment/ui";
import type { PhotoItem } from "~/types/photo";

export const Route = createFileRoute("/photos/$id/edit")({
  component: PhotoEditPage,
});

function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocal(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function PhotoEditPage() {
  const params = Route.useParams();
  const navigate = useNavigate();

  const [photo] = createResource(
    () => params().id,
    async (photoId) => {
      const res = await fetch(`/api/photos/${photoId}`);
      if (!res.ok) return null;
      return (await res.json()) as PhotoItem;
    },
  );

  const [title, setTitle] = createSignal("");
  const [description, setDescription] = createSignal("");
  const [tags, setTags] = createSignal<string[]>([]);
  const [date, setDate] = createSignal("");
  const [geoLat, setGeoLat] = createSignal("");
  const [geoLng, setGeoLng] = createSignal("");
  const [saving, setSaving] = createSignal(false);

  createEffect(() => {
    const p = photo();
    if (!p) return;

    setTitle(p.title);
    setDescription(p.description || "");
    setTags([...p.tags]);
    setDate(toDatetimeLocal(p.date));
    setGeoLat(p.geo ? String(p.geo.lat) : "");
    setGeoLng(p.geo ? String(p.geo.lng) : "");
  });

  const handleSave = async () => {
    const p = photo();
    if (!p) return;

    setSaving(true);
    try {
      const lat = parseFloat(geoLat());
      const lng = parseFloat(geoLng());
      const geo = !Number.isNaN(lat) && !Number.isNaN(lng) ? { lat, lng } : null;

      const res = await fetch(`/api/photos/${p.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title(),
          description: description(),
          tags: tags(),
          date: fromDatetimeLocal(date()),
          geo,
        }),
      });

      if (res.ok) {
        toast.success("Photo updated");
        navigate({ to: "/" });
      } else {
        toast.error("Failed to update photo");
      }
    } catch (e) {
      console.error("Failed to update photo:", e);
      toast.error("Failed to update photo");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div class="mx-auto max-w-2xl space-y-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <Button variant="ghost" size="icon" class="size-8" onClick={() => navigate({ to: "/" })}>
            <ArrowLeft size={16} />
          </Button>
          <h1 class="text-lg font-semibold">Edit Photo</h1>
        </div>
        <Button size="sm" onClick={handleSave} disabled={!photo() || saving()}>
          <Save size={14} />
          {saving() ? "Saving..." : "Save"}
        </Button>
      </div>

      <Show
        when={photo()}
        fallback={
          <div class="flex items-center gap-2 text-muted-foreground">
            <Spinner size="sm" />
            <p class="text-sm">Loading...</p>
          </div>
        }
      >
        <>
          <Show when={photo()?.thumbnailUrl}>
            <div class="rounded-lg overflow-hidden border border-border">
              <img
                src={photo()!.thumbnailUrl}
                alt={photo()!.title}
                class="w-full max-h-60 object-cover"
              />
            </div>
          </Show>

          <div class="space-y-4">
            <div>
              <Label class="mb-1.5 block text-xs font-medium text-muted-foreground">Title</Label>
              <Input
                value={title()}
                onInput={(e) => setTitle(e.currentTarget.value)}
                placeholder="Photo title"
              />
            </div>

            <div>
              <Label class="mb-1.5 block text-xs font-medium text-muted-foreground">
                Description
              </Label>
              <Textarea
                value={description()}
                onInput={(e) => setDescription(e.currentTarget.value)}
                placeholder="Photo description (optional)"
                rows={3}
              />
            </div>

            <div>
              <Label class="mb-1.5 block text-xs font-medium text-muted-foreground">Tags</Label>
              <TagInput
                value={tags()}
                onChange={setTags}
                placeholder="Add tags (press Enter or comma to add)"
                maxTags={10}
              />
            </div>

            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label class="mb-1.5 block text-xs font-medium text-muted-foreground">Date</Label>
                <Input
                  type="datetime-local"
                  value={date()}
                  onInput={(e) => setDate(e.currentTarget.value)}
                />
              </div>
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <Label class="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Latitude
                  </Label>
                  <Input
                    type="number"
                    step="any"
                    value={geoLat()}
                    onInput={(e) => setGeoLat(e.currentTarget.value)}
                    placeholder="—"
                  />
                </div>
                <div>
                  <Label class="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Longitude
                  </Label>
                  <Input
                    type="number"
                    step="any"
                    value={geoLng()}
                    onInput={(e) => setGeoLng(e.currentTarget.value)}
                    placeholder="—"
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      </Show>
    </div>
  );
}
