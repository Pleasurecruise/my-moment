import { splitProps, type ComponentProps } from "solid-js";
import { cn } from "../lib/utils";

export interface InputProps extends ComponentProps<"input"> {
  error?: boolean;
}

export function Input(props: InputProps) {
  const [local, rest] = splitProps(props, ["class", "error"]);

  return (
    <input
      {...rest}
      class={cn(
        "flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
        local.error
          ? "border-destructive focus-visible:ring-destructive"
          : "border-border focus-visible:ring-ring",
        local.class,
      )}
    />
  );
}
