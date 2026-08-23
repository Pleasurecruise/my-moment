import type { ComponentProps } from "@solidjs/web";
import { cn } from "../lib/utils";
import { omit } from "solid-js";

export interface SeparatorProps extends ComponentProps<"div"> {
  orientation?: "horizontal" | "vertical";
}

export function Separator(props: SeparatorProps) {
  const local = props;
  const rest = omit(props, "class", "orientation");

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
