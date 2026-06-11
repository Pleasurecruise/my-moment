import {
  createSignal,
  createMemo,
  onCleanup,
  For,
  Show,
  Switch,
  Match,
  splitProps,
  type ComponentProps,
  type JSX,
} from "solid-js";
import { Upload, Image, Check, X } from "lucide-solid";
import { cn, Spinner } from "@my-moment/ui";

export type BatchUploadStatus = "idle" | "dragover" | "uploading" | "done" | "error";

export type FileItemStatus = "pending" | "uploading" | "success" | "error" | "cancelled";

export interface FileItem {
  id: string;
  file: File;
  previewUrl: string | null;
  status: FileItemStatus;
  progress: number;
  errorMessage: string | null;
}

export interface BatchProgress {
  totalBytes: number;
  uploadedBytes: number;
  fraction: number;
  files: Array<{ name: string; fraction: number }>;
}

export interface BatchUploadError {
  message: string;
  code?: string;
  file?: File;
}

export type BatchUploadHandler = (
  file: File,
  reportProgress: (loaded: number, total: number) => void,
  signal: AbortSignal,
) => Promise<void>;

export interface BatchPhotoUploadProps extends Omit<ComponentProps<"div">, "onProgress"> {
  accept?: string;
  maxSize?: number;
  maxFiles?: number;
  onUpload: BatchUploadHandler;
  onStart?: (files: File[]) => void;
  onUploadProgress?: (progress: BatchProgress) => void;
  onFileComplete?: (file: File, status: FileItemStatus, error?: BatchUploadError) => void;
  onComplete?: (results: Array<{ file: File; status: FileItemStatus }>) => void;
  onError?: (error: BatchUploadError) => void;
  onCancel?: () => void;
  label?: string;
  hint?: string;
  icon?: JSX.Element;
  disabled?: boolean;
  clearOnComplete?: boolean;
}

const DEFAULT_ACCEPT = "image/*";
const DEFAULT_MAX_FILES = 20;

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** i;
  return `${i === 0 ? value : value.toFixed(1)} ${units[i]}`;
}

function uid(): string {
  return crypto.randomUUID();
}

function validateFile(file: File, opts: { accept?: string; maxSize?: number }): string | null {
  if (opts.maxSize && file.size > opts.maxSize) {
    return `File too large (max ${formatBytes(opts.maxSize)})`;
  }
  if (opts.accept) {
    const patterns = opts.accept.split(",").map((s) => s.trim());
    const matches = patterns.some((pattern) => {
      if (pattern.endsWith("/*")) return file.type.startsWith(pattern.slice(0, -1));
      if (pattern.startsWith(".")) return file.name.toLowerCase().endsWith(pattern.toLowerCase());
      return file.type === pattern;
    });
    if (!matches) return "Unsupported file type";
  }
  return null;
}

export function BatchPhotoUpload(props: BatchPhotoUploadProps) {
  const [local, rest] = splitProps(props, [
    "accept",
    "maxSize",
    "maxFiles",
    "onUpload",
    "onStart",
    "onUploadProgress",
    "onFileComplete",
    "onComplete",
    "onError",
    "onCancel",
    "label",
    "hint",
    "icon",
    "disabled",
    "clearOnComplete",
    "class",
  ]);

  const [zoneStatus, setZoneStatus] = createSignal<BatchUploadStatus>("idle");
  const [files, setFiles] = createSignal<FileItem[]>([]);
  let inputRef: HTMLInputElement | undefined = undefined;
  const abortControllers = new Map<string, AbortController>();

  // Cleanup abort controllers on component unmount
  onCleanup(() => {
    for (const ctrl of abortControllers.values()) ctrl.abort();
    abortControllers.clear();
  });

  const accept = () => local.accept ?? DEFAULT_ACCEPT;
  const maxFiles = () => local.maxFiles ?? DEFAULT_MAX_FILES;
  const canInteract = () => !local.disabled && zoneStatus() !== "uploading";
  const isUploading = () => zoneStatus() === "uploading";

  const doneCount = createMemo(
    () => files().filter((f) => f.status === "success" || f.status === "error").length,
  );
  const totalBytes = createMemo(() => files().reduce((sum, f) => sum + f.file.size, 0));
  const uploadedBytes = createMemo(() =>
    files().reduce((sum, f) => sum + Math.round(f.progress * f.file.size), 0),
  );

  function revokeAllPreviews() {
    for (const f of files()) {
      if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
    }
  }

  function reset() {
    revokeAllPreviews();
    for (const ctrl of abortControllers.values()) ctrl.abort();
    abortControllers.clear();
    setFiles([]);
    setZoneStatus("idle");
  }

  function removeFile(id: string) {
    setFiles((prev) => {
      const idx = prev.findIndex((f) => f.id === id);
      if (idx === -1) return prev;
      const item = prev[idx];
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      abortControllers.get(id)?.abort();
      abortControllers.delete(id);
      const next = [...prev];
      next.splice(idx, 1);
      return next;
    });
  }

  function updateFile(id: string, patch: Partial<FileItem>) {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }

  function buildBatchProgress(): BatchProgress {
    const items = files();
    const tb = items.reduce((s, f) => s + f.file.size, 0);
    const ub = items.reduce((s, f) => s + Math.round(f.progress * f.file.size), 0);
    return {
      totalBytes: tb,
      uploadedBytes: ub,
      fraction: tb > 0 ? ub / tb : 0,
      files: items.map((f) => ({ name: f.file.name, fraction: f.progress })),
    };
  }

  async function addFiles(newFiles: FileList | File[]) {
    const arr = Array.from(newFiles);
    const items: FileItem[] = [];
    const remaining = maxFiles() - files().length;

    for (let i = 0; i < arr.length && items.length < remaining; i++) {
      const file = arr[i];
      const err = validateFile(file, { accept: accept(), maxSize: local.maxSize });
      if (err) {
        items.push({
          id: uid(),
          file,
          previewUrl: null,
          status: "error",
          progress: 0,
          errorMessage: err,
        });
        continue;
      }
      items.push({
        id: uid(),
        file,
        previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
        status: "pending",
        progress: 0,
        errorMessage: null,
      });
    }

    setFiles((prev) => [...prev, ...items]);
    if (items.length > 0) await uploadPending();
  }

  async function uploadPending() {
    const pending = files().filter((f) => f.status === "pending");
    if (pending.length === 0) return;

    setZoneStatus("uploading");
    local.onStart?.(pending.map((f) => f.file));

    const results: Array<{ file: File; status: FileItemStatus }> = [];

    for (const item of pending) {
      if (zoneStatus() !== "uploading") break;

      const ctrl = new AbortController();
      abortControllers.set(item.id, ctrl);
      updateFile(item.id, { status: "uploading", progress: 0 });

      try {
        await local.onUpload(
          item.file,
          (loaded, total) => {
            const fraction = total > 0 ? Math.min(1, loaded / total) : 0;
            updateFile(item.id, { progress: fraction });
            local.onUploadProgress?.(buildBatchProgress());
          },
          ctrl.signal,
        );
        updateFile(item.id, { status: "success", progress: 1 });
        results.push({ file: item.file, status: "success" });
        local.onFileComplete?.(item.file, "success");
      } catch (err: unknown) {
        if ((err as DOMException)?.name === "AbortError") {
          updateFile(item.id, { status: "cancelled", errorMessage: "Cancelled" });
          results.push({ file: item.file, status: "cancelled" });
        } else {
          const message = err instanceof Error ? err.message : "Upload failed";
          updateFile(item.id, { status: "error", errorMessage: message });
          results.push({ file: item.file, status: "error" });
          local.onError?.({ message, file: item.file });
          local.onFileComplete?.(item.file, "error", { message, file: item.file });
        }
      } finally {
        abortControllers.delete(item.id);
      }
    }

    setZoneStatus("done");
    local.onComplete?.(results);
    if (local.clearOnComplete) setTimeout(reset, 2000);
  }

  function cancelAll() {
    for (const ctrl of abortControllers.values()) ctrl.abort();
    abortControllers.clear();
    setFiles((prev) =>
      prev.map((f) =>
        f.status === "uploading" || f.status === "pending"
          ? { ...f, status: "cancelled" as FileItemStatus, errorMessage: "Cancelled" }
          : f,
      ),
    );
    setZoneStatus("done");
    local.onCancel?.();
  }

  function onClick() {
    if (!canInteract()) return;
    inputRef?.click();
  }

  function onInputChange(e: Event) {
    const target = e.currentTarget as HTMLInputElement;
    if (target.files?.length) addFiles(target.files);
    target.value = "";
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault();
    if (!canInteract()) return;
    setZoneStatus("dragover");
  }

  function onDragLeave() {
    if (zoneStatus() === "dragover") setZoneStatus(files().length > 0 ? "done" : "idle");
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    if (!canInteract()) return;
    if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files);
    setZoneStatus("idle");
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  }

  const dropZoneClasses = () =>
    cn(
      "relative cursor-pointer rounded-lg border-2 border-dashed p-6 transition-all",
      zoneStatus() === "dragover" && "border-primary bg-primary/5 scale-[1.01]",
      local.disabled && "cursor-not-allowed opacity-50",
      !local.disabled && "hover:border-primary/50 hover:bg-accent/50",
      local.class,
    );

  return (
    <div {...rest} class="w-full space-y-4">
      <input
        ref={(el) => {
          inputRef = el;
        }}
        type="file"
        accept={accept()}
        multiple
        class="hidden"
        onChange={onInputChange}
        disabled={local.disabled || isUploading()}
      />

      <div
        role="button"
        tabIndex={local.disabled ? -1 : 0}
        class={dropZoneClasses()}
        onClick={onClick}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onKeyDown={onKeyDown}
        aria-label={local.label ?? "点击或拖拽上传图片"}
        aria-disabled={local.disabled}
      >
        <div class="flex flex-col items-center gap-2">
          {local.icon ?? <Upload class="size-8" />}
          <span class="text-sm font-medium">{local.label ?? "点击或拖拽上传图片"}</span>
          <Show when={local.hint}>
            <span class="text-xs text-muted-foreground">{local.hint}</span>
          </Show>
        </div>
      </div>

      <Show when={isUploading()}>
        <div class="space-y-1.5">
          <div class="flex items-center justify-between text-xs">
            <span class="text-muted-foreground">
              Uploading {doneCount()}/{files().length}
            </span>
            <span class="tabular-nums text-muted-foreground">
              {formatBytes(uploadedBytes())} / {formatBytes(totalBytes())}
            </span>
          </div>
          <div class="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              class="h-full rounded-full bg-primary transition-all duration-300 ease-out"
              style={{
                width: `${Math.round((uploadedBytes() / Math.max(1, totalBytes())) * 100)}%`,
              }}
            />
          </div>
          <button
            type="button"
            onClick={cancelAll}
            class="text-xs text-muted-foreground underline-offset-2 hover:text-destructive hover:underline"
          >
            Cancel all
          </button>
        </div>
      </Show>

      <Show when={files().length > 0}>
        <ul class="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          <For each={files()}>
            {(item) => (
              <li class="group relative overflow-hidden rounded-lg border border-border bg-card">
                <Show
                  when={item.previewUrl}
                  fallback={
                    <div class="flex aspect-square items-center justify-center bg-muted">
                      <Image class="size-4 text-muted-foreground" />
                    </div>
                  }
                >
                  <div class="relative aspect-square">
                    <img
                      src={item.previewUrl!}
                      alt={item.file.name}
                      class="h-full w-full object-cover"
                    />
                    <Switch>
                      <Match when={item.status === "uploading"}>
                        <div class="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/40">
                          <Spinner class="size-6 text-white" />
                          <span class="text-xs font-medium text-white">
                            {Math.round(item.progress * 100)}%
                          </span>
                        </div>
                      </Match>
                      <Match when={item.status === "success"}>
                        <div class="absolute inset-0 flex items-center justify-center bg-success/20">
                          <Check class="size-4 rounded-full bg-success p-0.5 text-success-foreground" />
                        </div>
                      </Match>
                      <Match when={item.status === "error"}>
                        <div class="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-destructive/10 p-2">
                          <X class="size-4 text-destructive" />
                          <Show when={item.errorMessage}>
                            <span class="text-center text-[10px] leading-tight text-destructive">
                              {item.errorMessage}
                            </span>
                          </Show>
                        </div>
                      </Match>
                    </Switch>
                  </div>
                </Show>
                <div class="space-y-0.5 p-1.5">
                  <p class="truncate text-xs font-medium" title={item.file.name}>
                    {item.file.name}
                  </p>
                  <p class="text-[10px] tabular-nums text-muted-foreground">
                    {formatBytes(item.file.size)}
                  </p>
                </div>
                <Show when={item.status !== "uploading"}>
                  <button
                    type="button"
                    class="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-background/80 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive hover:text-destructive-foreground group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(item.id);
                    }}
                    aria-label={`移除 ${item.file.name}`}
                  >
                    <X class="size-3" />
                  </button>
                </Show>
              </li>
            )}
          </For>
        </ul>
      </Show>

      <Show when={zoneStatus() === "done" && files().length > 0 && !local.clearOnComplete}>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="rounded-md border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent"
            onClick={reset}
          >
            Clear all
          </button>
          <Show when={files().some((f) => f.status === "error")}>
            <button
              type="button"
              class="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              onClick={() => {
                setFiles((prev) =>
                  prev.map((f) =>
                    f.status === "error"
                      ? {
                          ...f,
                          status: "pending" as FileItemStatus,
                          progress: 0,
                          errorMessage: null,
                        }
                      : f,
                  ),
                );
                uploadPending();
              }}
            >
              Retry failed
            </button>
          </Show>
          <span class="ml-auto text-xs text-muted-foreground">
            {files().length} file{files().length !== 1 ? "s" : ""}
            <Show when={local.maxSize}>
              <span> · max {formatBytes(local.maxSize!)} per file</span>
            </Show>
          </span>
        </div>
      </Show>
    </div>
  );
}
