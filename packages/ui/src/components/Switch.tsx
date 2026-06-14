import { splitProps, type ComponentProps } from "solid-js";
import { Switch as KobalteSwitch } from "@kobalte/core";
import { cn } from "../lib/utils";

export const Switch = KobalteSwitch.Root;

export function SwitchInput(props: ComponentProps<typeof KobalteSwitch.Input>) {
  return <KobalteSwitch.Input {...props} />;
}

export function SwitchControl(props: ComponentProps<typeof KobalteSwitch.Control>) {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <KobalteSwitch.Control
      {...rest}
      class={cn(
        "inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent",
        "shadow-sm transition-colors",
        "data-[checked]:bg-primary data-[unchecked]:bg-input",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:cursor-not-allowed disabled:opacity-50",
        local.class,
      )}
    />
  );
}

export function SwitchThumb(props: ComponentProps<typeof KobalteSwitch.Thumb>) {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <KobalteSwitch.Thumb
      {...rest}
      class={cn(
        "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0",
        "transition-transform",
        "data-[checked]:translate-x-4 data-[unchecked]:translate-x-0",
        local.class,
      )}
    />
  );
}

export function SwitchLabel(props: ComponentProps<typeof KobalteSwitch.Label>) {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <KobalteSwitch.Label
      {...rest}
      class={cn(
        "text-sm font-medium leading-none",
        "peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        local.class,
      )}
    />
  );
}

export function SwitchDescription(props: ComponentProps<typeof KobalteSwitch.Description>) {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <KobalteSwitch.Description {...rest} class={cn("text-xs text-muted-foreground", local.class)} />
  );
}

export function SwitchErrorMessage(props: ComponentProps<typeof KobalteSwitch.ErrorMessage>) {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <KobalteSwitch.ErrorMessage {...rest} class={cn("text-xs text-destructive", local.class)} />
  );
}
