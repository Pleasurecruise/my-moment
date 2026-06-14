import { splitProps, type ComponentProps } from "solid-js";
import { cn } from "../lib/utils";

export interface SeparatorProps extends ComponentProps<"div"> {
  orientation?: "horizontal" | "vertical";
}

export function Separator(props: SeparatorProps) {
  const [local, rest] = splitProps(props, ["class", "orientation"]);

  return (
    <div
      {...rest}
      role="separator"
      aria-orientation={local.orientation ?? "horizontal"}
      class={cn(
        "shrink-0 bg-border",
        (local.orientation ?? "horizontal") === "horizontal" ? "h-px w-full" : "h-full w-px",
        local.class,
      )}
    />
  );
}
