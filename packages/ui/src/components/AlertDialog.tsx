import { splitProps, type ComponentProps } from "solid-js";
import { AlertDialog as KobalteAlertDialog } from "@kobalte/core";
import { cn } from "../lib/utils";

export const AlertDialog = KobalteAlertDialog.Root;

export const AlertDialogTrigger = KobalteAlertDialog.Trigger;

export const AlertDialogPortal = KobalteAlertDialog.Portal;

export function AlertDialogOverlay(props: ComponentProps<typeof KobalteAlertDialog.Overlay>) {
  return (
    <KobalteAlertDialog.Overlay
      {...props}
      class={cn(
        "fixed inset-0 z-50 bg-black/80",
        "data-[expanded]:animate-in data-[expanded]:fade-in-0",
        "data-[closed]:animate-out data-[closed]:fade-out-0",
        props.class,
      )}
    />
  );
}

export function AlertDialogContent(props: ComponentProps<typeof KobalteAlertDialog.Content>) {
  return (
    <KobalteAlertDialog.Portal>
      <AlertDialogOverlay />
      <KobalteAlertDialog.Content
        {...props}
        class={cn(
          "fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2",
          "gap-4 border border-border bg-background p-6 shadow-lg",
          "duration-200",
          "data-[expanded]:animate-in data-[expanded]:fade-in-0 data-[expanded]:zoom-in-95 data-[expanded]:slide-in-from-left-1/2 data-[expanded]:slide-in-from-top-[48%]",
          "data-[closed]:animate-out data-[closed]:fade-out-0 data-[closed]:zoom-out-95 data-[closed]:slide-out-to-left-1/2 data-[closed]:slide-out-to-top-[48%]",
          "sm:rounded-lg",
          props.class,
        )}
      />
    </KobalteAlertDialog.Portal>
  );
}

export function AlertDialogHeader(props: ComponentProps<"div">) {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <div {...rest} class={cn("flex flex-col space-y-2 text-center sm:text-left", local.class)} />
  );
}

export function AlertDialogFooter(props: ComponentProps<"div">) {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <div
      {...rest}
      class={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", local.class)}
    />
  );
}

export function AlertDialogTitle(props: ComponentProps<typeof KobalteAlertDialog.Title>) {
  return <KobalteAlertDialog.Title {...props} class={cn("text-lg font-semibold", props.class)} />;
}

export function AlertDialogDescription(
  props: ComponentProps<typeof KobalteAlertDialog.Description>,
) {
  return (
    <KobalteAlertDialog.Description
      {...props}
      class={cn("text-sm text-muted-foreground", props.class)}
    />
  );
}

export function AlertDialogAction(props: ComponentProps<typeof KobalteAlertDialog.CloseButton>) {
  return <KobalteAlertDialog.CloseButton {...props} />;
}

export function AlertDialogCancel(props: ComponentProps<typeof KobalteAlertDialog.CloseButton>) {
  return <KobalteAlertDialog.CloseButton {...props} />;
}
