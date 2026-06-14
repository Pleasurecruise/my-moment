import { splitProps, type ComponentProps } from "solid-js";
import { Popover as KobaltePopover } from "@kobalte/core";
import { cn } from "../lib/utils";

export const Popover = KobaltePopover.Root;

export const PopoverTrigger = KobaltePopover.Trigger;

export const PopoverAnchor = KobaltePopover.Anchor;

export function PopoverContent(props: ComponentProps<typeof KobaltePopover.Content>) {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <KobaltePopover.Portal>
      <KobaltePopover.Content
        {...rest}
        class={cn(
          "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none",
          "data-[expanded]:animate-in data-[expanded]:fade-in-0 data-[expanded]:zoom-in-95",
          "data-[closed]:animate-out data-[closed]:fade-out-0 data-[closed]:zoom-out-95",
          "data-[side=bottom]:slide-in-from-top-2",
          "data-[side=left]:slide-in-from-right-2",
          "data-[side=right]:slide-in-from-left-2",
          "data-[side=top]:slide-in-from-bottom-2",
          local.class,
        )}
      />
    </KobaltePopover.Portal>
  );
}

export function PopoverClose(props: ComponentProps<typeof KobaltePopover.CloseButton>) {
  return <KobaltePopover.CloseButton {...props} />;
}

export function PopoverDescription(props: ComponentProps<typeof KobaltePopover.Description>) {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <KobaltePopover.Description
      {...rest}
      class={cn("text-sm text-muted-foreground", local.class)}
    />
  );
}
