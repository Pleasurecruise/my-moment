import { createFileRoute, useNavigate } from "@tanstack/solid-router";
import { Upload, ArrowLeft, X } from "lucide-solid";
import { Show, createSignal, createMemo, onCleanup } from "solid-js";
import { Button, Input, Textarea, TagInput, Label, toast } from "@my-moment/ui";
import { processImage, type ImageProcessResult } from "~/lib/image-processor";

export const Route = createFileRoute("/upload")({
  component: UploadPage,
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

function UploadPage() {
  const navigate = useNavigate();

  const [file, setFile] = createSignal<File | null>(null);
  const [processed, setProcessed] = createSignal<ImageProcessResult | null>(null);
  const [previewUrl, setPreviewUrl] = createSignal<string | null>(null);
  const [processing, setProcessing] = createSignal(false);

  const [title, setTitle] = createSignal("");
  const [description, setDescription] = createSignal("");
  const [tags, setTags] = createSignal<string[]>([]);
  const [date, setDate] = createSignal("");
  const [geoLat, setGeoLat] = createSignal("");
  const [geoLng, setGeoLng] = createSignal("");
  const [publishing, setPublishing] = createSignal(false);

  onCleanup(() => {
    if (previewUrl()) URL.revokeObjectURL(previewUrl()!);
  });

  const reset = () => {
    if (previewUrl()) URL.revokeObjectURL(previewUrl()!);
    setFile(null);
    setProcessed(null);
    setPreviewUrl(null);
    setTitle("");
    setDescription("");
    setTags([]);
    setDate("");
    setGeoLat("");
    setGeoLng("");
  };

  const handleFileSelect = async (selected: File) => {
    if (!selected.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (selected.size > 20 * 1024 * 1024) {
      toast.error("File too large (max 20MB)");
      return;
    }

    if (previewUrl()) URL.revokeObjectURL(previewUrl()!);

    setFile(selected);
    setProcessing(true);
    try {
      const result = await processImage(selected);
      setProcessed(result);
      setPreviewUrl(URL.createObjectURL(result.image));
      setTitle(selected.name.replace(/\.[^.]+$/, ""));
      setDate(toDatetimeLocal(result.exifDate));
      if (result.exifGeo) {
        setGeoLat(String(result.exifGeo.lat));
        setGeoLng(String(result.exifGeo.lng));
      } else {
        setGeoLat("");
        setGeoLng("");
      }
    } catch (e) {
      console.error("Failed to process image:", e);
      toast.error("Failed to process image");
      reset();
    } finally {
      setProcessing(false);
    }
  };

  const onInputChange = (e: Event) => {
    const target = e.currentTarget as HTMLInputElement;
    const f = target.files?.[0];
    if (f) handleFileSelect(f);
    target.value = "";
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer?.files?.[0];
    if (f) handleFileSelect(f);
  };

  const canPublish = createMemo(() => !!file() && !!processed() && !processing() && !publishing());

  const handlePublish = async () => {
    const f = file();
    const p = processed();
    if (!f || !p) return;

    setPublishing(true);
    try {
      const form = new FormData();
      form.append("file", p.image, f.name.replace(/\.[^.]+$/, ".png"));
      form.append("thumbnail", p.thumbnail, "thumbnail.jpg");
      form.append("width", String(p.width));
      form.append("height", String(p.height));
      form.append("aspectRatio", String(p.aspectRatio));
      if (p.thumbHash) form.append("thumbHash", p.thumbHash);

      form.append("title", title().trim() || f.name);
      form.append("description", description().trim());
      if (tags().length > 0) form.append("tags", JSON.stringify(tags()));

      const iso = fromDatetimeLocal(date());
      if (iso) form.append("date", iso);

      const lat = parseFloat(geoLat());
      const lng = parseFloat(geoLng());
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        form.append("geo", JSON.stringify({ lat, lng }));
      }

      const res = await fetch("/api/photos/upload", {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(body || `Upload failed: ${res.status}`);
      }

      toast.success("Photo published");
      reset();
      navigate({ to: "/" });
    } catch (e) {
      console.error("Failed to publish photo:", e);
      toast.error(e instanceof Error ? e.message : "Failed to publish photo");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div class="mx-auto max-w-2xl space-y-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <Button variant="ghost" size="icon" class="size-8" onClick={() => navigate({ to: "/" })}>
            <ArrowLeft size={16} />
          </Button>
          <div class="flex items-center gap-2">
            <Upload size={18} class="text-muted-foreground" />
            <h1 class="text-lg font-semibold">Upload Photo</h1>
          </div>
        </div>
        <Button size="sm" onClick={handlePublish} disabled={!canPublish()}>
          {publishing() ? "Publishing..." : "Publish"}
        </Button>
      </div>

      <Show
        when={file()}
        fallback={
          <label
            class="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-10 transition-all hover:border-primary/50 hover:bg-accent/50"
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
          >
            <Upload class="size-8 text-muted-foreground" />
            <span class="text-sm font-medium">Click or drag to select a photo</span>
            <span class="text-xs text-muted-foreground">JPG, PNG, WebP, GIF, AVIF — max 20MB</span>
            <input type="file" accept="image/*" class="hidden" onChange={onInputChange} />
          </label>
        }
      >
        <div class="space-y-5">
          {/* Preview */}
          <div class="relative overflow-hidden rounded-lg border border-border">
            <Show
              when={previewUrl()}
              fallback={
                <div class="flex h-48 items-center justify-center bg-muted text-sm text-muted-foreground">
                  {processing() ? "Processing..." : "No preview"}
                </div>
              }
            >
              <img
                src={previewUrl()!}
                alt={file()!.name}
                class="max-h-96 w-full object-contain bg-muted"
              />
            </Show>
            <button
              type="button"
              onClick={reset}
              class="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
              aria-label="Remove photo"
            >
              <X size={14} />
            </button>
          </div>

          <Show when={processed()}>
            <p class="text-xs text-muted-foreground">
              {processed()!.width} × {processed()!.height}
              {" · "}
              {(file()!.size / 1024 / 1024).toFixed(1)} MB
            </p>
          </Show>

          <div class="space-y-4">
            <div>
              <Label class="mb-1.5 block text-xs font-medium text-muted-foreground">Title</Label>
              <Input
                type="text"
                value={title()}
                onInput={(e) => setTitle(e.currentTarget.value)}
                placeholder="Photo title"
                maxLength={120}
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
                rows={2}
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
                <Label class="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Date <span class="text-muted-foreground/60">(from EXIF, editable)</span>
                </Label>
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
        </div>
      </Show>
    </div>
  );
}
