import { Show, createSignal, type JSX } from "solid-js";
import { Button, Input, Label, toast, cn } from "@my-moment/ui";
import { BatchPhotoUpload } from "~/components/upload";
import { PenLine } from "lucide-solid";
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

  const updateField = <K extends keyof WishFormData>(key: K, value: WishFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleImageUpload = async (
    file: File,
    reportProgress: (loaded: number, total: number) => void,
    signal: AbortSignal,
  ) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/haul/upload", {
        method: "POST",
        body: formData,
        signal,
      });

      if (res.ok) {
        const data: { url: string } = await res.json();
        updateField("imageUrl", data.url);
        reportProgress(file.size, file.size);
      } else {
        throw new Error("Upload failed");
      }
    } catch (err) {
      if ((err as DOMException)?.name === "AbortError") return;
      throw err;
    }
  };

  const validate = (): string | null => {
    const r = wishFormSchema.safeParse(form());
    return r.success ? null : (r.error.issues[0]?.message ?? "validation failed");
  };

  const [isSubmitting, setIsSubmitting] = createSignal(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await props.addItem(form());
      if (result) {
        props.onSuccess?.();
      }
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

        <Show
          when={form().imageUrl}
          fallback={
            <BatchPhotoUpload
              accept="image/*"
              maxSize={10 * 1024 * 1024}
              maxFiles={1}
              onUpload={handleImageUpload}
              label="Click or drag to upload"
              hint="JPG/PNG/WebP, max 10MB"
              clearOnComplete={false}
            />
          }
        >
          <div class="relative group rounded-lg overflow-hidden border border-border">
            <img src={form().imageUrl} alt="Item photo" class="w-full h-48 object-cover" />
            <div class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <button
                type="button"
                onClick={() => updateField("imageUrl", undefined)}
                class="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 bg-white/90 rounded-md text-sm text-red-500 hover:bg-white cursor-pointer shadow-lg"
              >
                Remove
              </button>
            </div>
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
