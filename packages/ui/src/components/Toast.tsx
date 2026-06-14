import { Show, splitProps, type ComponentProps, type JSX } from "solid-js";
import { Toast as KobalteToast, toaster } from "@kobalte/core";
import { cn } from "../lib/utils";
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-solid";

export { toaster };

export type ToastVariant = "default" | "success" | "error" | "warning" | "info";

export interface ToastData {
  title?: string;
  description?: string;
  variant?: ToastVariant;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const variantIcons: Record<ToastVariant, () => JSX.Element> = {
  default: () => null,
  success: () => <CheckCircle class="h-4 w-4 text-success" />,
  error: () => <AlertCircle class="h-4 w-4 text-destructive" />,
  warning: () => <AlertTriangle class="h-4 w-4 text-warning" />,
  info: () => <Info class="h-4 w-4 text-info" />,
};

const variantStyles: Record<ToastVariant, string> = {
  default: "border-border bg-background text-foreground",
  success: "border-success/30 bg-success/10 text-foreground",
  error: "border-destructive/30 bg-destructive/10 text-foreground",
  warning: "border-warning/30 bg-warning/10 text-foreground",
  info: "border-info/30 bg-info/10 text-foreground",
};

export function Toaster() {
  return (
    <KobalteToast.Region limit={5} swipeDirection="right" duration={5000}>
      <KobalteToast.List
        class={cn(
          "fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse gap-2 p-4",
          "sm:bottom-4 sm:right-4 sm:max-w-[420px]",
        )}
      />
    </KobalteToast.Region>
  );
}

export function ToastRoot(props: ComponentProps<typeof KobalteToast.Root>) {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    <KobalteToast.Root
      {...rest}
      class={cn(
        "group pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-lg border p-4",
        "shadow-lg transition-all",
        "data-[expanded]:animate-in data-[expanded]:fade-in-0 data-[expanded]:zoom-in-95",
        "data-[closed]:animate-out data-[closed]:fade-out-0 data-[closed]:zoom-out-95",
        "data-[swipe=move]:translate-x-[var(--kb-toast-swipe-move-x)]",
        "data-[swipe=cancel]:translate-x-0",
        "data-[swipe=end]:animate-out data-[swipe=end]:fade-out-80 data-[swipe=end]:slide-out-to-right-full",
        local.class,
      )}
    >
      {local.children}
    </KobalteToast.Root>
  );
}

export function ToastContent(props: { class?: string; children: JSX.Element }) {
  return <div class={cn("flex-1", props.class)}>{props.children}</div>;
}

export function ToastTitle(props: ComponentProps<typeof KobalteToast.Title>) {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <KobalteToast.Title
      {...rest}
      class={cn("text-sm font-semibold [&+div]:text-xs", local.class)}
    />
  );
}

export function ToastDescription(props: ComponentProps<typeof KobalteToast.Description>) {
  const [local, rest] = splitProps(props, ["class"]);
  return <KobalteToast.Description {...rest} class={cn("text-sm opacity-90", local.class)} />;
}

export function ToastClose(props: ComponentProps<typeof KobalteToast.CloseButton>) {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <KobalteToast.CloseButton
      {...rest}
      class={cn(
        "absolute right-2 top-2 rounded-md p-1",
        "text-foreground/50 opacity-0 transition-opacity",
        "hover:text-foreground",
        "focus:opacity-100 focus:outline-none focus:ring-1",
        "group-hover:opacity-100",
        local.class,
      )}
    >
      <X class="h-4 w-4" />
    </KobalteToast.CloseButton>
  );
}

export function ToastProgress(props: ComponentProps<typeof KobalteToast.ProgressTrack>) {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <KobalteToast.ProgressTrack
      {...rest}
      class={cn("h-1 w-full overflow-hidden rounded-full bg-muted", local.class)}
    >
      <KobalteToast.ProgressFill class="h-full rounded-full bg-primary transition-all duration-150" />
    </KobalteToast.ProgressTrack>
  );
}

export function showToast(data: ToastData) {
  const variant = data.variant ?? "default";
  toaster.show((props) => (
    <ToastRoot toastId={props.toastId} class={variantStyles[variant]}>
      {variantIcons[variant]()}
      <ToastContent>
        <Show when={data.title}>
          <ToastTitle>{data.title}</ToastTitle>
        </Show>
        <Show when={data.description}>
          <ToastDescription>{data.description}</ToastDescription>
        </Show>
      </ToastContent>
      <Show when={data.action}>
        <button
          type="button"
          onClick={data.action!.onClick}
          class="inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          {data.action!.label}
        </button>
      </Show>
      <ToastClose />
    </ToastRoot>
  ));
}

export const toast = {
  show: showToast,
  success: (title: string, description?: string) =>
    showToast({ title, description, variant: "success" }),
  error: (title: string, description?: string) =>
    showToast({ title, description, variant: "error" }),
  warning: (title: string, description?: string) =>
    showToast({ title, description, variant: "warning" }),
  info: (title: string, description?: string) => showToast({ title, description, variant: "info" }),
};
