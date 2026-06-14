import { splitProps, type ComponentProps } from "solid-js";
import { Tooltip as KobalteTooltip } from "@kobalte/core";
import { cn } from "../lib/utils";

export const Tooltip = KobalteTooltip.Root;

export const TooltipTrigger = KobalteTooltip.Trigger;

export function TooltipContent(props: ComponentProps<typeof KobalteTooltip.Content>) {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <KobalteTooltip.Portal>
      <KobalteTooltip.Content
        {...rest}
        class={cn(
          "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md",
          "data-[expanded]:animate-in data-[expanded]:fade-in-0 data-[expanded]:zoom-in-95",
          "data-[closed]:animate-out data-[closed]:fade-out-0 data-[closed]:zoom-out-95",
          "data-[side=bottom]:slide-in-from-top-2",
          "data-[side=left]:slide-in-from-right-2",
          "data-[side=right]:slide-in-from-left-2",
          "data-[side=top]:slide-in-from-bottom-2",
          local.class,
        )}
      />
    </KobalteTooltip.Portal>
  );
}

export function TooltipArrow(props: ComponentProps<typeof KobalteTooltip.Arrow>) {
  return <KobalteTooltip.Arrow {...props} />;
}
