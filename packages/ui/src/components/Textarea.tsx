import { splitProps, type ComponentProps } from "solid-js";
import { cn } from "../lib/utils";

export interface TextareaProps extends ComponentProps<"textarea"> {
  error?: boolean;
  autoresize?: boolean;
}

export function Textarea(props: TextareaProps) {
  const [local, rest] = splitProps(props, ["class", "error", "autoresize"]);

  return (
    <textarea
      {...rest}
      class={cn(
        "flex min-h-20 w-full rounded-md border bg-background px-3 py-2",
        "font-sans text-sm text-foreground placeholder:text-muted-foreground",
        "outline-none transition-colors duration-100 resize-y",
        "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
        local.autoresize && "resize-none overflow-hidden",
        local.error
          ? "border-destructive focus-visible:ring-destructive"
          : "border-border focus-visible:ring-ring",
        local.class,
      )}
      oninput={(e) => {
        if (local.autoresize) {
          const el = e.currentTarget;
          el.style.height = "auto";
          el.style.height = el.scrollHeight + "px";
        }
        rest.oninput?.(e);
      }}
    />
  );
}
