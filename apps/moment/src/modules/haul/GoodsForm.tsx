import { Show, createSignal, type JSX } from "solid-js";
import { Button, Input, Textarea, Label, toast, cn } from "@my-moment/ui";
import { BatchPhotoUpload } from "~/components/upload";
import { PenLine, Star, ExternalLink, Link } from "lucide-solid";
import {
  CATEGORY_CONFIG,
  RATING_CONFIG,
  goodsFormSchema,
  type Category,
  type GoodsFormData,
  type GoodsItem,
  type Rating,
} from "./types";

interface GoodsFormProps {
  addItem: (data: GoodsFormData) => Promise<GoodsItem | null>;
  editItem?: GoodsItem;
  onSuccess?: () => void;
  onCancel?: () => void;
}

function getLocalDate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const INITIAL_FORM: GoodsFormData = {
  name: "",
  brand: "",
  price: "",
  category: "digital",
  rating: "great",
  purchaseDate: getLocalDate(),
  comment: "",
  imageUrl: undefined,
  purchaseLink: undefined,
};

function getInitialForm(editItem?: GoodsItem): GoodsFormData {
  if (!editItem) return { ...INITIAL_FORM };
  return {
    name: editItem.name,
    brand: editItem.brand || "",
    price: String(editItem.price),
    category: editItem.category,
    rating: editItem.rating,
    purchaseDate: editItem.purchaseDate,
    comment: editItem.comment,
    imageUrl: editItem.imageUrl,
    purchaseLink: editItem.purchaseLink || "",
  };
}

export function GoodsForm(props: GoodsFormProps) {
  const isEditing = () => !!props.editItem;
  const [form, setForm] = createSignal<GoodsFormData>(getInitialForm(props.editItem));

  const updateField = <K extends keyof GoodsFormData>(key: K, value: GoodsFormData[K]) => {
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
    const r = goodsFormSchema.safeParse(form());
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
            placeholder="e.g. AirPods Pro 2"
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
              placeholder="Apple"
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
              placeholder="1899"
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

      <div class="space-y-3">
        <SectionLabel label="Your Review" icon={<Star size={14} />} />

        <div>
          <p class="block text-xs font-medium text-muted-foreground mb-1.5">Rating</p>
          <div class="flex gap-2">
            {(Object.keys(RATING_CONFIG) as Rating[]).map((r) => {
              const config = RATING_CONFIG[r];
              const isActive = () => form().rating === r;
              return (
                <button
                  type="button"
                  onClick={() => updateField("rating", r)}
                  class={cn(
                    "flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-lg border-2 transition-all duration-200 cursor-pointer select-none",
                    isActive()
                      ? "border-current shadow-sm scale-[1.02]"
                      : "border-border hover:border-foreground/20 opacity-60 hover:opacity-80",
                  )}
                  style={
                    isActive() ? { "border-color": config.color, color: config.color } : undefined
                  }
                >
                  <span class="text-lg">
                    {r === "worth" ? "👍" : r === "great" ? "🔥" : r === "amazing" ? "❤️" : "👑"}
                  </span>
                  <span class="text-xs font-semibold">{config.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <Label class="text-xs text-muted-foreground mb-1">Purchase Date</Label>
          <Input
            type="date"
            value={form().purchaseDate}
            onInput={(e) => updateField("purchaseDate", e.currentTarget.value)}
          />
        </div>

        <div>
          <Label class="text-xs text-muted-foreground mb-1">
            Purchase Link
            <span class="ml-1.5 text-muted-foreground/60 font-normal">
              Optional, URL or status (e.g. delisted)
            </span>
          </Label>
          <div class="relative">
            <Link
              size={14}
              class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <Input
              type="text"
              value={form().purchaseLink || ""}
              onInput={(e) => updateField("purchaseLink", e.currentTarget.value)}
              placeholder="https://... or delisted"
              class="pl-9"
            />
          </div>
          <Show when={form().purchaseLink}>
            {(() => {
              const link = form().purchaseLink!;
              return /^https?:\/\//.test(link) ? (
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="mt-1.5 inline-flex items-center gap-1 text-[11px] text-primary hover:underline transition-colors"
                >
                  <ExternalLink size={10} />
                  Preview Link
                </a>
              ) : (
                <span class="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                  Delisted
                </span>
              );
            })()}
          </Show>
        </div>

        <div>
          <Label class="text-xs text-muted-foreground mb-1" required>
            Short Review
          </Label>
          <Textarea
            value={form().comment}
            onInput={(e) => updateField("comment", e.currentTarget.value)}
            placeholder='e.g. "Noise canceling is amazing, finally quiet on the subway"'
            rows={2}
            maxLength={200}
            class="resize-none"
          />
          <p class="mt-0.5 text-[11px] text-muted-foreground text-right">
            {form().comment.length}/200
          </p>
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
          <Star size={16} />
          {isSubmitting() ? "Submitting..." : isEditing() ? "Update Item" : "Add Item"}
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
