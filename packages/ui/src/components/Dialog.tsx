import { Show, splitProps, type ComponentProps, type JSX } from "solid-js";
import { X } from "lucide-solid";
import { cn } from "../lib/utils";

export interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: JSX.Element;
}

export function Dialog(props: DialogProps) {
  return (
    <Show when={props.open}>
      <div
        class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) props.onOpenChange?.(false);
        }}
      >
        {props.children}
      </div>
    </Show>
  );
}

export interface DialogContentProps extends ComponentProps<"div"> {
  onClose?: () => void;
}

export function DialogContent(props: DialogContentProps) {
  const [local, rest] = splitProps(props, ["class", "children", "onClose"]);
  return (
    <div
      {...rest}
      class={cn(
        "relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-background rounded-lg border border-border shadow-lg",
        local.class,
      )}
    >
      <Show when={local.onClose}>
        <div class="sticky top-0 z-10 flex justify-end px-6 pt-6 pb-0">
          <button
            type="button"
            onClick={local.onClose}
            class="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
          >
            <X class="h-4 w-4" />
            <span class="sr-only">Close</span>
          </button>
        </div>
      </Show>
      {local.children}
    </div>
  );
}

export function DialogHeader(props: ComponentProps<"div">) {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    <div {...rest} class={cn("p-6 pb-0", local.class)}>
      {local.children}
    </div>
  );
}

export function DialogTitle(props: ComponentProps<"h2">) {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    <h2 {...rest} class={cn("text-lg font-semibold", local.class)}>
      {local.children}
    </h2>
  );
}

export function DialogDescription(props: ComponentProps<"p">) {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    <p {...rest} class={cn("text-sm text-muted-foreground", local.class)}>
      {local.children}
    </p>
  );
}

export function DialogBody(props: ComponentProps<"div">) {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    <div {...rest} class={cn("p-6", local.class)}>
      {local.children}
    </div>
  );
}

export function DialogFooter(props: ComponentProps<"div">) {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    <div {...rest} class={cn("flex items-center justify-end gap-2 p-6 pt-0", local.class)}>
      {local.children}
    </div>
  );
}
