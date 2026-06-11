import {
  createSignal,
  Show,
  Switch,
  Match,
  splitProps,
  type ComponentProps,
  type JSX,
} from "solid-js";
import { Upload, File, Check, X } from "lucide-solid";
import { cn, Spinner } from "@my-moment/ui";

export type UploadStatus =
  | "idle"
  | "dragover"
  | "validating"
  | "uploading"
  | "success"
  | "error"
  | "cancelled";

export interface FileUploadProgress {
  loaded: number;
  total: number;
  fraction: number;
}

export interface UploadError {
  message: string;
  code?: string;
}

export type UploadHandler = (
  file: File,
  reportProgress?: (loaded: number, total: number) => void,
) => Promise<void>;

export interface FileUploadProps extends Omit<ComponentProps<"div">, "onProgress"> {
  accept?: string;
  maxSize?: number;
  maxNameLength?: number;
  onUpload: UploadHandler;
  onStart?: (file: File) => void;
  onUploadProgress?: (progress: FileUploadProgress) => void;
  onSuccess?: (file: File) => void;
  onError?: (error: UploadError, file?: File) => void;
  onCancel?: () => void;
  onValidate?: (file: File) => string | null;
  label?: string;
  hint?: string;
  icon?: JSX.Element;
  showPreview?: boolean;
  disabled?: boolean;
  clearOnSuccess?: boolean;
}

const DEFAULT_ACCEPT_IMAGE = "image/*";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** i;
  return `${i === 0 ? value : value.toFixed(1)} ${units[i]}`;
}

function validateFile(
  file: File,
  opts: {
    accept?: string;
    maxSize?: number;
    maxNameLength?: number;
    onValidate?: (file: File) => string | null;
  },
): string | null {
  if (opts.maxSize && file.size > opts.maxSize) {
    return `File too large (max ${formatBytes(opts.maxSize)}, got ${formatBytes(file.size)})`;
  }
  if (opts.maxNameLength && file.name.length > opts.maxNameLength) {
    return `File name too long (max ${opts.maxNameLength} characters)`;
  }
  if (opts.accept) {
    const patterns = opts.accept.split(",").map((s) => s.trim());
    const matchesPattern = patterns.some((pattern) => {
      if (pattern.endsWith("/*")) return file.type.startsWith(pattern.slice(0, -1));
      if (pattern.startsWith(".")) return file.name.toLowerCase().endsWith(pattern.toLowerCase());
      return file.type === pattern;
    });
    if (!matchesPattern) return `Unsupported file type (allowed: ${opts.accept})`;
  }
  return opts.onValidate?.(file) ?? null;
}

export function FileUpload(props: FileUploadProps) {
  const [local, rest] = splitProps(props, [
    "accept",
    "maxSize",
    "maxNameLength",
    "onUpload",
    "onStart",
    "onUploadProgress",
    "onSuccess",
    "onError",
    "onCancel",
    "onValidate",
    "label",
    "hint",
    "icon",
    "showPreview",
    "disabled",
    "clearOnSuccess",
    "class",
  ]);

  const [status, setStatus] = createSignal<UploadStatus>("idle");
  const [file, setFile] = createSignal<File | null>(null);
  const [previewUrl, setPreviewUrl] = createSignal<string | null>(null);
  const [progress, setProgress] = createSignal<FileUploadProgress>({
    loaded: 0,
    total: 0,
    fraction: 0,
  });
  const [errorMessage, setErrorMessage] = createSignal<string>("");

  let inputRef: HTMLInputElement | undefined = undefined;

  const showPreview = () => local.showPreview !== false;
  const isImage = () => file()?.type.startsWith("image/") ?? false;
  const canInteract = () => !local.disabled && status() !== "uploading";

  function revokePreview() {
    const url = previewUrl();
    if (url) {
      URL.revokeObjectURL(url);
      setPreviewUrl(null);
    }
  }

  function reset() {
    revokePreview();
    setFile(null);
    setStatus("idle");
    setProgress({ loaded: 0, total: 0, fraction: 0 });
    setErrorMessage("");
  }

  async function handleFile(selected: File) {
    setStatus("validating");
    const err = validateFile(selected, {
      accept: local.accept,
      maxSize: local.maxSize,
      maxNameLength: local.maxNameLength,
      onValidate: local.onValidate,
    });
    if (err) {
      setStatus("error");
      setErrorMessage(err);
      local.onError?.({ message: err }, selected);
      return;
    }

    setFile(selected);
    setErrorMessage("");
    if (showPreview() && selected.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(selected));
    }

    setStatus("uploading");
    local.onStart?.(selected);
    try {
      await local.onUpload(selected, (loaded, total) => {
        const fraction = total > 0 ? Math.min(1, loaded / total) : 0;
        setProgress({ loaded, total, fraction });
        local.onUploadProgress?.({ loaded, total, fraction });
      });
      setStatus("success");
      local.onSuccess?.(selected);
      if (local.clearOnSuccess) setTimeout(reset, 1500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Upload failed, please try again";
      setStatus("error");
      setErrorMessage(message);
      local.onError?.({ message, code: (err as { code?: string }).code }, selected);
    }
  }

  function onClick() {
    if (!canInteract()) return;
    inputRef?.click();
  }

  function onInputChange(e: Event) {
    const target = e.currentTarget as HTMLInputElement;
    const f = target.files?.[0];
    if (f) handleFile(f);
    target.value = "";
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault();
    if (!canInteract()) return;
    setStatus("dragover");
  }

  function onDragLeave() {
    if (status() === "dragover") setStatus(file() ? "success" : "idle");
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    if (!canInteract()) return;
    const f = e.dataTransfer?.files?.[0];
    if (f) handleFile(f);
    setStatus(file() ? "success" : "idle");
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  }

  function onCancelClick(e: Event) {
    e.stopPropagation();
    revokePreview();
    setFile(null);
    setStatus("cancelled");
    local.onCancel?.();
    setTimeout(() => setStatus("idle"), 300);
  }

  const dropZoneClasses = () =>
    cn(
      "relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-all",
      status() === "dragover" && "border-primary bg-primary/5 scale-[1.02]",
      status() === "error" && "border-destructive bg-destructive/5",
      status() === "success" && "border-success bg-success/10",
      status() === "uploading" && "border-primary/50 bg-primary/5",
      local.disabled && "cursor-not-allowed opacity-50",
      !local.disabled && "hover:border-primary/50 hover:bg-accent/50",
      local.class,
    );

  return (
    <div {...rest} class="w-full">
      <input
        ref={(el) => {
          inputRef = el;
        }}
        type="file"
        accept={local.accept}
        class="hidden"
        onChange={onInputChange}
        disabled={local.disabled}
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
        aria-label={local.label ?? "点击或拖拽上传文件"}
        aria-disabled={local.disabled}
      >
        <Switch>
          <Match when={status() === "uploading" && file()}>
            <div class="flex w-full flex-col items-center gap-3">
              <Spinner class="size-8" />
              <div class="w-full max-w-xs space-y-1.5">
                <div class="flex items-center justify-between text-sm">
                  <span class="truncate font-medium">{file()!.name}</span>
                  <span class="ml-2 shrink-0 tabular-nums text-muted-foreground">
                    {formatBytes(file()!.size)}
                  </span>
                </div>
                <div class="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    class="h-full rounded-full bg-primary transition-all duration-300 ease-out"
                    style={{ width: `${Math.round(progress().fraction * 100)}%` }}
                  />
                </div>
                <p class="text-xs text-muted-foreground">Uploading...</p>
              </div>
              <button
                type="button"
                class="mt-1 rounded-md px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                onClick={onCancelClick}
              >
                Cancel
              </button>
            </div>
          </Match>

          <Match when={status() === "success" && file()}>
            <div class="flex w-full flex-col items-center gap-2">
              {showPreview() && isImage() && previewUrl() ? (
                <img
                  src={previewUrl()!}
                  alt={file()!.name}
                  class="h-24 w-24 rounded-lg object-cover shadow-sm"
                />
              ) : (
                <Check class="size-5 text-success" />
              )}
              <span class="text-sm font-medium text-success">Upload complete</span>
              <span class="max-w-[200px] truncate text-xs text-muted-foreground">
                {file()!.name}
              </span>
              {!local.clearOnSuccess && (
                <button
                  type="button"
                  class="mt-1 rounded-md px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  onClick={onCancelClick}
                >
                  Remove
                </button>
              )}
            </div>
          </Match>

          <Match when={status() === "error"}>
            <div class="flex flex-col items-center gap-2">
              <X class="size-5 text-destructive" />
              <span class="text-sm font-medium text-destructive">Upload failed</span>
              <Show when={errorMessage()}>
                <p class="max-w-[280px] text-center text-xs text-muted-foreground">
                  {errorMessage()}
                </p>
              </Show>
              <button
                type="button"
                class="mt-1 rounded-md px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  reset();
                  onClick();
                }}
              >
                Retry
              </button>
            </div>
          </Match>

          <Match when={true}>
            {local.icon ??
              (local.accept === DEFAULT_ACCEPT_IMAGE ? (
                <Upload class="size-8" />
              ) : (
                <File class="size-8" />
              ))}
            <span class="text-sm font-medium">{local.label ?? "点击或拖拽上传文件"}</span>
            <Show when={local.hint}>
              <span class="text-xs text-muted-foreground">{local.hint}</span>
            </Show>
          </Match>
        </Switch>
      </div>
    </div>
  );
}
