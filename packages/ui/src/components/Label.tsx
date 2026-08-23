import { Show } from "solid-js";
import type { ComponentProps } from "@solidjs/web";
import { cn } from "../lib/utils";
import { omit } from "solid-js";

export interface LabelProps extends ComponentProps<"label"> {
  required?: boolean;
  error?: boolean;
}

export function Label(props: LabelProps) {
  const local = props;
  const rest = omit(props, "class", "required", "error", "children");

  return (
    <label
      {...rest}
      class={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        local.error ? "text-destructive" : "text-foreground",
        local.class,
      )}
    >
      {local.children}
      <Show when={local.required}>
        <span class="ml-1 text-destructive">*</span>
      </Show>
    </label>
  );
}
