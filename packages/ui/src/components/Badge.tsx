import { splitProps, type ComponentProps } from "solid-js";
import { cn } from "../lib/utils";

const badgeVariants = {
  default: "bg-primary text-primary-foreground",
  secondary: "bg-secondary text-secondary-foreground",
  destructive: "bg-destructive text-destructive-foreground",
  outline: "border border-border text-foreground",
} as const;

export interface BadgeProps extends ComponentProps<"div"> {
  variant?: keyof typeof badgeVariants;
}

export function Badge(props: BadgeProps) {
  const [local, rest] = splitProps(props, ["class", "variant"]);

  return (
    <div
      {...rest}
      class={cn(
        "inline-flex items-center rounded-full border border-transparent px-2.5 py-0.5 text-xs font-semibold transition-colors",
        badgeVariants[local.variant ?? "default"],
        local.class,
      )}
    />
  );
}
