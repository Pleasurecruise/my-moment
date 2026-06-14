import { createSignal, splitProps, type ComponentProps, For, Show } from "solid-js";
import { Tag } from "./Tag";
import { cn } from "../lib/utils";

export type TagInputVariant = "default" | "secondary" | "destructive" | "outline";

export interface TagInputProps extends Omit<ComponentProps<"div">, "onChange"> {
  value?: string[];
  onChange?: (tags: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  maxTags?: number;
  tagVariant?: TagInputVariant;
  error?: boolean;
}

export function TagInput(props: TagInputProps) {
  const [local, rest] = splitProps(props, [
    "class",
    "value",
    "onChange",
    "placeholder",
    "disabled",
    "maxTags",
    "tagVariant",
    "error",
  ]);

  const [inputValue, setInputValue] = createSignal("");

  const tags = () => local.value ?? [];
  const maxReached = () => local.maxTags !== undefined && tags().length >= local.maxTags;

  function addTag(tag: string) {
    const trimmed = tag.trim().toLowerCase();
    if (!trimmed) return;
    if (tags().includes(trimmed)) return;
    if (maxReached()) return;

    local.onChange?.([...tags(), trimmed]);
    setInputValue("");
  }

  function removeTag(index: number) {
    const newTags = [...tags()];
    newTags.splice(index, 1);
    local.onChange?.(newTags);
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (local.disabled) return;

    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(inputValue());
    }

    if (e.key === "Backspace" && inputValue() === "" && tags().length > 0) {
      removeTag(tags().length - 1);
    }
  }

  function handlePaste(e: ClipboardEvent) {
    if (local.disabled) return;

    const text = e.clipboardData?.getData("text");
    if (text) {
      e.preventDefault();
      const pastedTags = text
        .split(/[,\n\t]+/)
        .map((t) => t.trim())
        .filter(Boolean);
      const newTags = [...tags()];
      for (const tag of pastedTags) {
        const normalized = tag.toLowerCase();
        if (!newTags.includes(normalized) && !maxReached()) {
          newTags.push(normalized);
        }
      }
      local.onChange?.(newTags);
      setInputValue("");
    }
  }

  return (
    <div
      {...rest}
      class={cn(
        "flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-md border bg-background px-3 py-1.5",
        "transition-colors duration-100",
        "focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-background",
        local.disabled && "cursor-not-allowed opacity-50",
        local.error
          ? "border-destructive focus-within:ring-destructive"
          : "border-border focus-within:ring-ring",
        local.class,
      )}
    >
      <For each={tags()}>
        {(tag, index) => (
          <Tag
            variant={local.tagVariant ?? "secondary"}
            removable={!local.disabled}
            onRemove={() => removeTag(index())}
          >
            {tag}
          </Tag>
        )}
      </For>
      <Show when={!maxReached()}>
        <input
          type="text"
          value={inputValue()}
          onInput={(e) => setInputValue(e.currentTarget.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={tags().length === 0 ? (local.placeholder ?? "Add tags...") : ""}
          disabled={local.disabled}
          class={cn(
            "flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground",
            "min-w-[60px] disabled:cursor-not-allowed",
          )}
        />
      </Show>
    </div>
  );
}
