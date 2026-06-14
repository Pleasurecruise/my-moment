import { splitProps, type ComponentProps, Show } from "solid-js";
import { X } from "lucide-solid";
import { cn } from "../lib/utils";

export type TagVariant = "default" | "secondary" | "destructive" | "outline";

export interface TagProps extends ComponentProps<"span"> {
  variant?: TagVariant;
  removable?: boolean;
  onRemove?: () => void;
}

const tagVariants: Record<TagVariant, string> = {
  default: "bg-primary/10 text-primary border-primary/20",
  secondary: "bg-secondary text-secondary-foreground border-secondary/20",
  destructive: "bg-destructive/10 text-destructive border-destructive/20",
  outline: "bg-transparent text-foreground border-border",
};

export function Tag(props: TagProps) {
  const [local, rest] = splitProps(props, [
    "class",
    "variant",
    "removable",
    "onRemove",
    "children",
  ]);

  return (
    <span
      {...rest}
      class={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
        tagVariants[local.variant ?? "default"],
        local.class,
      )}
    >
      {local.children}
      <Show when={local.removable}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            local.onRemove?.();
          }}
          class="ml-0.5 rounded-full p-0.5 opacity-70 hover:opacity-100 focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <X size={10} />
          <span class="sr-only">Remove</span>
        </button>
      </Show>
    </span>
  );
}
