import { Show } from "solid-js";
import type { ComponentProps } from "@solidjs/web";
import { cn } from "../lib/utils";
import { omit } from "solid-js";

export interface AvatarProps extends ComponentProps<"div"> {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: "sm" | "default" | "lg";
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  default: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
} as const;

export function Avatar(props: AvatarProps) {
  const local = props;
  const rest = omit(props, "class", "src", "alt", "fallback", "size");

  return (
    <div
      {...rest}
      class={cn(
        "relative flex shrink-0 overflow-hidden rounded-full bg-muted",
        sizeClasses[local.size ?? "default"],
        local.class,
      )}
    >
      <Show
        when={local.src}
        fallback={
          <span class="flex h-full w-full items-center justify-center font-medium text-muted-foreground">
            {local.fallback?.charAt(0)?.toUpperCase() ?? "?"}
          </span>
        }
      >
        {(src) => (
          <img
            src={src()!}
            alt={local.alt ?? ""}
            class="aspect-square h-full w-full object-cover"
          />
        )}
      </Show>
    </div>
  );
}
