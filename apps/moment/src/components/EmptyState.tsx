import { Show } from "solid-js";
import { Inbox } from "lucide-solid";
import { cn } from "@my-moment/ui";
import type { EmptyStateProps } from "~/types";

export function EmptyState(props: EmptyStateProps) {
  return (
    <div
      class={cn(
        "flex min-h-72 w-full flex-col items-center justify-center px-4 py-12 text-center",
        props.class,
      )}
    >
      <div class="mb-4 flex size-11 items-center justify-center rounded-full border border-border/80 bg-muted/40 text-muted-foreground">
        <Inbox size={20} strokeWidth={1.5} aria-hidden="true" />
      </div>
      <p class="text-sm font-medium text-foreground">{props.title}</p>
      <Show when={props.description !== undefined}>
        <div class="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">{props.description}</div>
      </Show>
      <Show when={props.action !== undefined}>
        <div class="mt-3">{props.action}</div>
      </Show>
    </div>
  );
}
