import { createSignal, For } from "solid-js";
import { Portal } from "solid-js/web";
import { cn } from "../lib/utils";

export type ToastVariant = "default" | "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  duration: number;
}

const [toasts, setToasts] = createSignal<Toast[]>([]);

let toastId = 0;

function addToast(message: string, variant: ToastVariant = "default", duration = 3000) {
  const id = String(++toastId);
  const toast: Toast = { id, message, variant, duration };
  setToasts((prev) => [...prev, toast]);

  if (duration > 0) {
    setTimeout(() => removeToast(id), duration);
  }

  return id;
}

function removeToast(id: string) {
  setToasts((prev) => prev.filter((t) => t.id !== id));
}

export const toast = {
  default: (message: string, duration?: number) => addToast(message, "default", duration),
  success: (message: string, duration?: number) => addToast(message, "success", duration),
  error: (message: string, duration?: number) => addToast(message, "error", duration),
  warning: (message: string, duration?: number) => addToast(message, "warning", duration),
  info: (message: string, duration?: number) => addToast(message, "info", duration),
};

const variantStyles: Record<ToastVariant, string> = {
  default: "bg-card text-foreground border-border",
  success: "bg-success text-success-foreground border-success/20",
  error: "bg-destructive text-destructive-foreground border-destructive/20",
  warning: "bg-warning text-warning-foreground border-warning/20",
  info: "bg-info text-info-foreground border-info/20",
};

export function Toaster() {
  return (
    <Portal>
      <div class="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        <For each={toasts()}>
          {(t) => (
            <div
              class={cn(
                "pointer-events-auto flex items-center justify-between gap-3 rounded-lg border px-4 py-3 shadow-lg transition-all",
                "animate-in slide-in-from-right-full fade-in duration-300",
                variantStyles[t.variant],
              )}
            >
              <p class="text-sm font-medium">{t.message}</p>
              <button
                type="button"
                class="shrink-0 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100"
                onClick={() => removeToast(t.id)}
              >
                <svg
                  class="size-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </For>
      </div>
    </Portal>
  );
}
