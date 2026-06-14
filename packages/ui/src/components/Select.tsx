import { splitProps, type ComponentProps } from "solid-js";
import { Select as KobalteSelect } from "@kobalte/core";
import { ChevronDown, Check } from "lucide-solid";
import { cn } from "../lib/utils";

export const Select = KobalteSelect.Root;

export const SelectValue = KobalteSelect.Value;

export const SelectHiddenSelect = KobalteSelect.HiddenSelect;

export function SelectTrigger(props: ComponentProps<typeof KobalteSelect.Trigger>) {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    <KobalteSelect.Trigger
      {...rest}
      class={cn(
        "flex h-9 w-full items-center justify-between rounded-md border border-border bg-transparent",
        "px-3 py-2 text-sm shadow-sm",
        "ring-offset-background placeholder:text-muted-foreground",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        local.class,
      )}
    >
      {local.children}
      <KobalteSelect.Icon>
        <ChevronDown class="h-4 w-4 opacity-50" />
      </KobalteSelect.Icon>
    </KobalteSelect.Trigger>
  );
}

export function SelectContent(props: ComponentProps<typeof KobalteSelect.Content>) {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <KobalteSelect.Portal>
      <KobalteSelect.Content
        {...rest}
        class={cn(
          "relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md",
          "data-[expanded]:animate-in data-[expanded]:fade-in-0 data-[expanded]:zoom-in-95",
          "data-[closed]:animate-out data-[closed]:fade-out-0 data-[closed]:zoom-out-95",
          local.class,
        )}
      >
        <KobalteSelect.Listbox class="p-1" />
      </KobalteSelect.Content>
    </KobalteSelect.Portal>
  );
}

export interface SelectItemProps extends ComponentProps<typeof KobalteSelect.Item> {
  label?: string;
}

export function SelectItem(props: SelectItemProps) {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    <KobalteSelect.Item
      {...rest}
      class={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm",
        "outline-none",
        "focus:bg-accent focus:text-accent-foreground",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        local.class,
      )}
    >
      <KobalteSelect.ItemIndicator class="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
        <Check class="h-4 w-4" />
      </KobalteSelect.ItemIndicator>
      <KobalteSelect.ItemLabel>{local.children}</KobalteSelect.ItemLabel>
    </KobalteSelect.Item>
  );
}

export function SelectLabel(props: ComponentProps<typeof KobalteSelect.Label>) {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <KobalteSelect.Label {...rest} class={cn("px-2 py-1.5 text-sm font-semibold", local.class)} />
  );
}

export function SelectSeparator(props: ComponentProps<"div">) {
  const [local, rest] = splitProps(props, ["class"]);
  return <div {...rest} class={cn("-mx-1 my-1 h-px bg-muted", local.class)} />;
}

export function SelectDescription(props: ComponentProps<typeof KobalteSelect.Description>) {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <KobalteSelect.Description {...rest} class={cn("text-xs text-muted-foreground", local.class)} />
  );
}

export function SelectErrorMessage(props: ComponentProps<typeof KobalteSelect.ErrorMessage>) {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <KobalteSelect.ErrorMessage {...rest} class={cn("text-xs text-destructive", local.class)} />
  );
}
