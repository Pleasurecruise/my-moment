import { Show } from "solid-js";
import { cn } from "@my-moment/ui";
import type { PageHeaderProps } from "~/types";

export function PageHeader(props: PageHeaderProps) {
  return (
    <header
      class={cn(
        "mb-6 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4",
        props.class,
      )}
    >
      <div class="min-w-0">
        <div class="flex items-center gap-2">
          <h1 class="text-wrap-balance text-lg font-semibold text-foreground">{props.title}</h1>
          {props.actions}
        </div>
        <Show when={props.subtitle !== undefined}>
          <p class="mt-1 text-sm text-muted-foreground">{props.subtitle}</p>
        </Show>
      </div>
      <Show when={props.controls}>
        <div class="flex w-full shrink-0 items-center justify-end gap-2 sm:w-auto">
          {props.controls}
        </div>
      </Show>
    </header>
  );
}
