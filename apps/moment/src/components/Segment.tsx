import { For } from "solid-js";
import { Button, cn } from "@my-moment/ui";

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  class?: string;
}

export function Segment<T extends string>(props: SegmentProps<T>) {
  return (
    <div class={cn("inline-flex rounded-md border border-border bg-muted p-0.5", props.class)}>
      <For each={props.options}>
        {(option) => {
          const isActive = () => option.value === props.value;
          return (
            <Button
              variant="ghost"
              size="sm"
              class={cn(
                "rounded-sm text-xs font-medium transition-colors",
                isActive()
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
              onClick={() => props.onChange(option.value)}
            >
              {option.label}
            </Button>
          );
        }}
      </For>
    </div>
  );
}
