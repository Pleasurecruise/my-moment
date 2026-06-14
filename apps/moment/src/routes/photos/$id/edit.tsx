import { createFileRoute, useNavigate } from "@tanstack/solid-router";
import { createResource, createSignal, Show } from "solid-js";
import { ArrowLeft, Save } from "lucide-solid";
import { Button, Input, Textarea, TagInput, toast } from "@my-moment/ui";
import type { PhotoItem } from "~/types/photo";

export const Route = createFileRoute("/photos/$id/edit")({
  component: PhotoEditPage,
});

function PhotoEditPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();

  const [photo] = createResource(
    () => id(),
    async (photoId) => {
      const res = await fetch(`/api/photos/${photoId}`);
      if (!res.ok) return null;
      return (await res.json()) as PhotoItem;
    },
  );

  const [title, setTitle] = createSignal("");
  const [description, setDescription] = createSignal("");
  const [tags, setTags] = createSignal<string[]>([]);
  const [saving, setSaving] = createSignal(false);

  // Initialize form when photo loads
  const initialized = () => {
    const p = photo();
    if (p && title() === "" && description() === "" && tags().length === 0) {
      setTitle(p.title);
      setDescription(p.description || "");
      setTags([...p.tags]);
    }
    return !!p;
  };

  const handleSave = async () => {
    const p = photo();
    if (!p) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/photos/${p.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title(),
          description: description(),
          tags: tags(),
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

      <Show when={photo()} fallback={<p class="text-sm text-muted-foreground">Loading...</p>}>
        {() => {
          initialized();
          return (
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
                  <label class="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Title
                  </label>
                  <Input
                    value={title()}
                    onInput={(e) => setTitle(e.currentTarget.value)}
                    placeholder="Photo title"
                  />
                </div>

                <div>
                  <label class="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Description
                  </label>
                  <Textarea
                    value={description()}
                    onInput={(e) => setDescription(e.currentTarget.value)}
                    placeholder="Photo description (optional)"
                    rows={3}
                  />
                </div>

                <div>
                  <label class="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Tags
                  </label>
                  <TagInput
                    value={tags()}
                    onChange={setTags}
                    placeholder="Add tags (press Enter or comma to add)"
                    maxTags={10}
                  />
                </div>
              </div>
            </>
          );
        }}
      </Show>
    </div>
  );
}
