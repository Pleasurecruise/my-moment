import { splitProps, type ComponentProps } from "solid-js";
import { cn } from "../lib/utils";

export interface SpinnerProps extends ComponentProps<"div"> {
  size?: "sm" | "default" | "lg";
}

const sizeClasses = {
  sm: "h-4 w-4 border-2",
  default: "h-6 w-6 border-[3px]",
  lg: "h-8 w-8 border-4",
} as const;

export function Spinner(props: SpinnerProps) {
  const [local, rest] = splitProps(props, ["class", "size"]);

  return (
    <div
      {...rest}
      role="status"
      aria-label="Loading"
      class={cn(
        "animate-spin rounded-full border-muted border-t-primary",
        sizeClasses[local.size ?? "default"],
        local.class,
      )}
    />
  );
}
