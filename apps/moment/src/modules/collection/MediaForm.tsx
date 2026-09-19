import { Show, createSignal, onCleanup } from "solid-js";
import { Button, Input, Label, Textarea, toast } from "@my-moment/ui";
import { Upload, X } from "lucide-solid";
import { processImage } from "~/lib/image";
import { mediaFormSchema, type MediaFormInput, type MediaItem, type MediaKind } from "~/types";

interface MediaFormProps {
  kind: MediaKind;
  addItem: (data: MediaFormInput) => Promise<MediaItem | null>;
  editItem?: MediaItem;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

interface FormState {
  title: string;
  description: string;
  date: string;
  imageUrl?: string;
}

function getInitialForm(editItem?: MediaItem): FormState {
  if (!editItem) return { title: "", description: "", date: "", imageUrl: undefined };
  return {
    title: editItem.title,
    description: editItem.description ?? "",
    date: editItem.date ?? "",
    imageUrl: editItem.imageUrl,
  };
}

export function MediaForm(props: MediaFormProps) {
  const isEditing = () => !!props.editItem;
  const [form, setForm] = createSignal<FormState>(getInitialForm(props.editItem));
  const [imageFile, setImageFile] = createSignal<File | null>(null);
  const [previewUrl, setPreviewUrl] = createSignal<string | undefined>();
  const [isSubmitting, setIsSubmitting] = createSignal(false);

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const displayImage = () => previewUrl() ?? form().imageUrl;

  const onImageInputChange = (e: Event) => {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error("File too large (max 10MB)");
      return;
    }
    const prev = previewUrl();
    if (prev) URL.revokeObjectURL(prev);
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const removeImage = () => {
    const prev = previewUrl();
    if (prev) URL.revokeObjectURL(prev);
    setPreviewUrl(undefined);
    setImageFile(null);
    updateField("imageUrl", undefined);
  };

  onCleanup(() => {
    const prev = previewUrl();
    if (prev) URL.revokeObjectURL(prev);
  });

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const { image } = await processImage(file);
      const formData = new FormData();
      formData.append("file", image, "image.png");
      formData.append("kind", props.kind);
      const res = await fetch("/api/media/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = (await res.json()) as { url: string };
      return data.url;
    } catch (err) {
      console.error("Failed to upload media image:", err);
      toast.error("Failed to upload image");
      return null;
    }
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    const parsed = mediaFormSchema.safeParse({ ...form(), kind: props.kind });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "validation failed");
      return;
    }

    setIsSubmitting(true);
    try {
      let data: MediaFormInput = parsed.data;
      const file = imageFile();
      if (file) {
        const url = await uploadImage(file);
        if (!url) return;
        data = { ...data, imageUrl: url };
      }
      const result = await props.addItem(data);
      if (result) props.onSuccess?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} class="space-y-5">
      <div class="space-y-3">
        <div>
          <Label class="mb-1 text-xs text-muted-foreground" required>
            Title
          </Label>
          <Input
            type="text"
            value={form().title}
            onInput={(e) => updateField("title", e.currentTarget.value)}
            placeholder={props.kind === "film" ? "e.g. Dune: Part Two" : "e.g. 葬送的芙莉莲"}
            maxlength={200}
          />
        </div>

        <div>
          <Label class="mb-1 text-xs text-muted-foreground">Description</Label>
          <Textarea
            value={form().description}
            onInput={(e) => updateField("description", e.currentTarget.value)}
            placeholder="A sentence or two about it…"
            rows={3}
            maxlength={500}
            class="resize-none"
          />
          <p class="mt-0.5 text-right text-[11px] text-muted-foreground">
            {form().description.length}/500
          </p>
        </div>

        <div>
          <Label class="mb-1 text-xs text-muted-foreground">Year</Label>
          <Input
            type="text"
            inputmode="numeric"
            placeholder="e.g. 2026"
            value={form().date}
            onInput={(e) => updateField("date", e.currentTarget.value.replace(/\D/g, "").slice(0, 4))}
            maxlength={4}
          />
        </div>
      </div>

      <div class="space-y-2">
        <Label class="text-xs text-muted-foreground">Cover image</Label>
        <Show when={displayImage()} fallback={<ImageUploadInput onChange={onImageInputChange} />}>
          <div class="relative overflow-hidden rounded-lg border border-border">
            <img src={displayImage()} alt="Cover" class="h-48 w-full object-cover" />
            <button
              type="button"
              onClick={removeImage}
              class="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
              aria-label="Remove cover"
            >
              <X size={14} />
            </button>
          </div>
        </Show>
      </div>

      <div class="flex gap-3 pt-2">
        <Show when={props.onCancel}>
          <Button type="button" variant="outline" class="flex-1" onClick={props.onCancel}>
            Cancel
          </Button>
        </Show>
        <Button type="submit" class="flex-1" disabled={isSubmitting()}>
          {isSubmitting() ? "Saving..." : isEditing() ? "Update" : "Add"}
        </Button>
      </div>
    </form>
  );
}

function ImageUploadInput(props: { onChange: (event: Event) => void }) {
  return (
    <label class="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-6 transition-all hover:border-primary/50 hover:bg-accent/50">
      <Upload class="size-8 text-muted-foreground" />
      <span class="text-sm font-medium">Click or drag to upload</span>
      <span class="text-xs text-muted-foreground">JPG/PNG/WebP, max 10MB</span>
      <input type="file" accept="image/*" class="hidden" onChange={props.onChange} />
    </label>
  );
}
