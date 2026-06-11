import { Show, createSignal, type JSX } from "solid-js";
import { Button, Input, toast, cn } from "@my-moment/ui";
import { FileUpload } from "~/components/FileUpload";
import { PenLine, Star, ExternalLink, Link } from "lucide-solid";
import {
  CATEGORY_CONFIG,
  RATING_CONFIG,
  type Category,
  type GoodsFormData,
  type GoodsItem,
  type Rating,
} from "./types";

interface GoodsFormProps {
  addItem: (data: GoodsFormData) => Promise<GoodsItem | null>;
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

export function GoodsForm(props: GoodsFormProps) {
  const [form, setForm] = createSignal<GoodsFormData>({ ...INITIAL_FORM });

  const update = <K extends keyof GoodsFormData>(key: K, value: GoodsFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleImageUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/haul/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        update("imageUrl", data.url);
      } else {
        toast.error("Upload failed");
      }
    } catch {
      toast.error("Upload failed, check your network");
    }
  };

  const validate = (): string | null => {
    if (!form().name.trim()) return "Item name is required";
    if (!form().price.trim() || Number.isNaN(Number(form().price))) return "Enter a valid price";
    if (Number(form().price) < 0) return "Price cannot be negative";
    if (!form().comment.trim()) return "Write a short review ✨";
    return null;
  };

  const [submitting, setSubmitting] = createSignal(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }

    setSubmitting(true);
    try {
      const result = await props.addItem(form());
      if (result) {
        props.onSuccess?.();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} class="space-y-5">
      {/* 基本信息 */}
      <div class="space-y-3">
        <SectionLabel label="Basic Info" icon={<PenLine size={14} />} />

        <div>
          <label class="block text-xs font-medium text-muted-foreground mb-1">
            Item Name <span class="text-red-400">*</span>
          </label>
          <Input
            type="text"
            value={form().name}
            onInput={(e) => update("name", e.currentTarget.value)}
            placeholder="e.g. AirPods Pro 2"
            maxLength={100}
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-muted-foreground mb-1">Brand</label>
            <Input
              type="text"
              value={form().brand}
              onInput={(e) => update("brand", e.currentTarget.value)}
              placeholder="Apple"
              maxLength={50}
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-muted-foreground mb-1">
              Price (¥) <span class="text-red-400">*</span>
            </label>
            <Input
              type="number"
              value={form().price}
              onInput={(e) => update("price", e.currentTarget.value)}
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
                  onClick={() => update("category", cat)}
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

      {/* 评价 */}
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
                  onClick={() => update("rating", r)}
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
          <label class="block text-xs font-medium text-muted-foreground mb-1">Purchase Date</label>
          <Input
            type="date"
            value={form().purchaseDate}
            onInput={(e) => update("purchaseDate", e.currentTarget.value)}
          />
        </div>

        <div>
          <label class="block text-xs font-medium text-muted-foreground mb-1">
            Purchase Link
            <span class="ml-1.5 text-muted-foreground/60 font-normal">
              Optional, for easy repurchase
            </span>
          </label>
          <div class="relative">
            <Link
              size={14}
              class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <Input
              type="url"
              value={form().purchaseLink || ""}
              onInput={(e) => update("purchaseLink", e.currentTarget.value)}
              placeholder="https://..."
              class="pl-9"
            />
          </div>
          <Show when={form().purchaseLink}>
            <a
              href={form().purchaseLink}
              target="_blank"
              rel="noopener noreferrer"
              class="mt-1.5 inline-flex items-center gap-1 text-[11px] text-primary hover:underline transition-colors"
            >
              <ExternalLink size={10} />
              Preview Link
            </a>
          </Show>
        </div>

        <div>
          <label class="block text-xs font-medium text-muted-foreground mb-1">
            Short Review <span class="text-red-400">*</span>
          </label>
          <textarea
            value={form().comment}
            onInput={(e) => update("comment", e.currentTarget.value)}
            placeholder='e.g. "Noise canceling is amazing, finally quiet on the subway"'
            rows={2}
            maxLength={200}
            class="w-full px-3 py-2 text-sm bg-background border border-border rounded-md placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-shadow resize-none"
          />
          <p class="mt-0.5 text-[11px] text-muted-foreground text-right">
            {form().comment.length}/200
          </p>
        </div>
      </div>

      {/* 照片 */}
      <div class="space-y-2">
        <SectionLabel label="Photo" icon={<span>📷</span>} optional />

        <Show
          when={form().imageUrl}
          fallback={
            <FileUpload
              accept="image/*"
              maxSize={10 * 1024 * 1024}
              onUpload={handleImageUpload}
              label="Click or drag to upload"
              hint="JPG/PNG/WebP, max 10MB"
              showPreview={true}
            />
          }
        >
          <div class="relative group rounded-lg overflow-hidden border border-border">
            <img src={form().imageUrl} alt="Item photo" class="w-full h-48 object-cover" />
            <div class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <button
                type="button"
                onClick={() => update("imageUrl", undefined)}
                class="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 bg-white/90 rounded-md text-sm text-red-500 hover:bg-white cursor-pointer shadow-lg"
              >
                Remove
              </button>
            </div>
          </div>
        </Show>
      </div>

      {/* 提交按钮 */}
      <div class="flex gap-3 pt-2">
        <Show when={props.onCancel}>
          <Button type="button" variant="outline" class="flex-1" onClick={props.onCancel}>
            Cancel
          </Button>
        </Show>
        <Button type="submit" class="flex-1" disabled={submitting()}>
          <Star size={16} />
          {submitting() ? "Submitting..." : "Add Item"}
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
