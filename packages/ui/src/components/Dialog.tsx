import { splitProps, type ComponentProps } from "solid-js";
import { Dialog as KobalteDialog } from "@kobalte/core";
import { cn } from "../lib/utils";
import { X } from "lucide-solid";

export const Dialog = KobalteDialog.Root;

export const DialogTrigger = KobalteDialog.Trigger;

export const DialogPortal = KobalteDialog.Portal;

export const DialogClose = KobalteDialog.CloseButton;

export function DialogOverlay(props: ComponentProps<typeof KobalteDialog.Overlay>) {
  return (
    <KobalteDialog.Overlay
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

export function DialogContent(props: ComponentProps<typeof KobalteDialog.Content>) {
  return (
    <KobalteDialog.Portal>
      <DialogOverlay />
      <KobalteDialog.Content
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
      >
        {props.children}
        <KobalteDialog.CloseButton
          class={cn(
            "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background",
            "transition-opacity hover:opacity-100",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            "disabled:pointer-events-none",
          )}
        >
          <X class="h-4 w-4" />
          <span class="sr-only">Close</span>
        </KobalteDialog.CloseButton>
      </KobalteDialog.Content>
    </KobalteDialog.Portal>
  );
}

export function DialogHeader(props: ComponentProps<"div">) {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <div {...rest} class={cn("flex flex-col space-y-1.5 text-center sm:text-left", local.class)} />
  );
}

export function DialogFooter(props: ComponentProps<"div">) {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <div
      {...rest}
      class={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", local.class)}
    />
  );
}

export function DialogTitle(props: ComponentProps<typeof KobalteDialog.Title>) {
  return (
    <KobalteDialog.Title
      {...props}
      class={cn("text-lg font-semibold leading-none tracking-tight", props.class)}
    />
  );
}

export function DialogDescription(props: ComponentProps<typeof KobalteDialog.Description>) {
  return (
    <KobalteDialog.Description
      {...props}
      class={cn("text-sm text-muted-foreground", props.class)}
    />
  );
}

export function DialogBody(props: ComponentProps<"div">) {
  const [local, rest] = splitProps(props, ["class"]);
  return <div {...rest} class={cn("p-6", local.class)} />;
}
