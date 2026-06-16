import { Show, createSignal, onCleanup, type JSX } from "solid-js";
import { Button, Input, Label, toast, cn } from "@my-moment/ui";
import { PenLine, Upload, X } from "lucide-solid";
import { processImage } from "~/lib/image-processor";
import { CATEGORY_CONFIG, wishFormSchema, type Category } from "./types";
import type { WishFormData, WishItem } from "./types";

interface WishFormProps {
  addItem: (data: WishFormData) => Promise<WishItem | null>;
  editItem?: WishItem;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const INITIAL_FORM: WishFormData = {
  name: "",
  brand: "",
  price: "",
  category: "digital",
  imageUrl: undefined,
};

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

function getInitialForm(editItem?: WishItem): WishFormData {
  if (!editItem) return { ...INITIAL_FORM };
  return {
    name: editItem.name,
    brand: editItem.brand || "",
    price: String(editItem.price),
    category: editItem.category,
    imageUrl: editItem.imageUrl,
  };
}

export function WishForm(props: WishFormProps) {
  const isEditing = () => !!props.editItem;
  const [form, setForm] = createSignal<WishFormData>(getInitialForm(props.editItem));
  const [imageFile, setImageFile] = createSignal<File | null>(null);
  const [previewUrl, setPreviewUrl] = createSignal<string | undefined>();
  const [isSubmitting, setIsSubmitting] = createSignal(false);

  const updateField = <K extends keyof WishFormData>(key: K, value: WishFormData[K]) => {
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

  const validate = (): string | null => {
    const r = wishFormSchema.safeParse(form());
    return r.success ? null : (r.error.issues[0]?.message ?? "validation failed");
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const { image } = await processImage(file);
      const formData = new FormData();
      formData.append("file", image, "image.png");
      const res = await fetch("/api/wish/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = (await res.json()) as { url: string };
      return data.url;
    } catch (err) {
      console.error("Failed to upload wishlist image:", err);
      toast.error("Failed to upload image");
      return null;
    }
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }

    setIsSubmitting(true);
    try {
      let data = form();
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
        <SectionLabel label="Basic Info" icon={<PenLine size={14} />} />

        <div>
          <Label class="text-xs text-muted-foreground mb-1" required>
            Item Name
          </Label>
          <Input
            type="text"
            value={form().name}
            onInput={(e) => updateField("name", e.currentTarget.value)}
            placeholder="e.g. Sony WH-1000XM5"
            maxLength={100}
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <Label class="text-xs text-muted-foreground mb-1">Brand</Label>
            <Input
              type="text"
              value={form().brand}
              onInput={(e) => updateField("brand", e.currentTarget.value)}
              placeholder="Sony"
              maxLength={50}
            />
          </div>
          <div>
            <Label class="text-xs text-muted-foreground mb-1" required>
              Price (¥)
            </Label>
            <Input
              type="number"
              value={form().price}
              onInput={(e) => updateField("price", e.currentTarget.value)}
              placeholder="2499"
              min={0}
              step="0.01"
            />
          </div>
        </div>

        <div>
          <p class="block text-xs font-medium text-muted-foreground mb-1.5">Category</p>
          <div class="flex flex-wrap gap-1.5">
            {(Object.keys(CATEGORY_CONFIG) as Category[]).map((cat) => {
              const isActive = () => form().category === cat;
              return (
                <button
                  type="button"
                  onClick={() => updateField("category", cat)}
                  class={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all duration-150 cursor-pointer select-none",
                    isActive()
                      ? "bg-primary/10 text-primary border-primary/20 shadow-sm"
                      : "bg-background text-muted-foreground border-border hover:border-foreground/20 hover:bg-muted",
                  )}
                >
                  {CATEGORY_CONFIG[cat].label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div class="space-y-2">
        <SectionLabel label="Photo" icon={<span>📷</span>} optional />

        <Show when={displayImage()} fallback={<ImageUploadInput onChange={onImageInputChange} />}>
          <div class="relative rounded-lg overflow-hidden border border-border">
            <img src={displayImage()} alt="Item photo" class="w-full h-48 object-cover" />
            <button
              type="button"
              onClick={removeImage}
              class="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
              aria-label="Remove photo"
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
          {isSubmitting() ? "Submitting..." : isEditing() ? "Update" : "Add to Wishlist"}
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

function SectionLabel(props: { label: string; icon: JSX.Element; optional?: boolean }) {
  return (
    <div class="flex items-center gap-1.5">
      <span class="text-muted-foreground">{props.icon}</span>
      <span class="text-sm font-semibold">{props.label}</span>
      <Show when={props.optional}>
        <span class="text-[11px] text-muted-foreground/60 font-normal">(Optional)</span>
      </Show>
    </div>
  );
}
