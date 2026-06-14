import {
  createSignal,
  createMemo,
  onCleanup,
  Show,
  splitProps,
  type ComponentProps,
  type JSX,
} from "solid-js";
import { Button } from "@my-moment/ui";
import { Upload } from "lucide-solid";
import { cn } from "@my-moment/ui";
import { FileUploadList } from "./FileUploadList";
import type { FileProgressEntry, PreviewCache, WorkflowPhase } from "./types";
import {
  formatBytes,
  entryFingerprint,
  createFileEntries,
  calculateTotalSize,
  calculateUploadedBytes,
  revokePreviewUrls,
  primePreviewCache,
  getErrorMessage,
} from "./utils";

export type BatchUploadStatus = "idle" | "dragover" | "uploading" | "done" | "error";

export type FileItemStatus = "pending" | "uploading" | "success" | "error" | "cancelled";

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
  const [files, setFiles] = createSignal<File[]>([]);
  const [entries, setEntries] = createSignal<FileProgressEntry[]>([]);
  const [phase, setPhase] = createSignal<WorkflowPhase>("review");
  const [workflowError, setWorkflowError] = createSignal<string | null>(null);
  const [showList, setShowList] = createSignal(false);

  let inputRef: HTMLInputElement | undefined = undefined;
  const abortControllers = new Map<string, AbortController>();
  const previewCache: PreviewCache = new Map();

  onCleanup(() => {
    for (const ctrl of abortControllers.values()) ctrl.abort();
    abortControllers.clear();
    revokePreviewUrls(previewCache);
  });

  const accept = () => local.accept ?? DEFAULT_ACCEPT;
  const maxFiles = () => local.maxFiles ?? DEFAULT_MAX_FILES;
  const canInteract = () => !local.disabled && phase() === "review";
  const isUploading = () => phase() === "uploading";

  const totalBytes = createMemo(() => calculateTotalSize(files()));
  const uploadedBytes = createMemo(() => calculateUploadedBytes(entries()));
  const overallProgress = createMemo(() => {
    const total = totalBytes();
    return total > 0 ? Math.min(1, uploadedBytes() / total) : 0;
  });

  function resetAll() {
    for (const ctrl of abortControllers.values()) ctrl.abort();
    abortControllers.clear();
    revokePreviewUrls(previewCache);
    setFiles([]);
    setEntries([]);
    setZoneStatus("idle");
    setPhase("review");
    setWorkflowError(null);
    setShowList(false);
  }

  function removeEntry(entry: FileProgressEntry) {
    if (phase() !== "review") return;

    const currentFiles = files();
    const removedFile = currentFiles[entry.index];
    if (!removedFile) return;

    const nextFiles = currentFiles.filter((_, i) => i !== entry.index);

    const fp = entryFingerprint(removedFile);
    const stillUsed = nextFiles.some((f) => entryFingerprint(f) === fp);
    if (!stillUsed) {
      revokePreviewUrls(previewCache, [fp]);
    }

    setFiles(nextFiles);
    setEntries(createFileEntries(nextFiles, previewCache));

    if (nextFiles.length === 0) {
      setShowList(false);
    }
  }

  function retryEntry(entry: FileProgressEntry) {
    if (phase() !== "completed" && phase() !== "error") return;

    setEntries((prev) =>
      prev.map((e) =>
        e.id === entry.id ? { ...e, status: "pending" as const, progress: 0, uploadedBytes: 0 } : e,
      ),
    );

    setPhase("review");
    setWorkflowError(null);
  }

  function retryAllFailed() {
    if (phase() !== "completed" && phase() !== "error") return;

    setEntries((prev) =>
      prev.map((e) =>
        e.status === "error"
          ? { ...e, status: "pending" as const, progress: 0, uploadedBytes: 0 }
          : e,
      ),
    );

    setPhase("review");
    setWorkflowError(null);
  }

  function updateEntry(id: string, patch: Partial<FileProgressEntry>) {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }

  async function addFiles(newFiles: FileList | File[]) {
    const incomingFiles = Array.from(newFiles);
    const currentFiles = files();
    const remaining = maxFiles() - currentFiles.length;
    const toAdd: File[] = [];

    for (let i = 0; i < incomingFiles.length && toAdd.length < remaining; i++) {
      toAdd.push(incomingFiles[i]);
    }

    if (toAdd.length === 0) return;

    const nextFiles = [...currentFiles, ...toAdd];
    setFiles(nextFiles);
    primePreviewCache(toAdd, previewCache);
    const newEntries = createFileEntries(nextFiles, previewCache);

    for (const entry of newEntries) {
      const file = nextFiles[entry.index];
      if (file) {
        const err = validateFile(file, { accept: accept(), maxSize: local.maxSize });
        if (err) {
          entry.status = "error";
        }
      }
    }

    setEntries(newEntries);
    setShowList(true);
  }

  async function uploadPending() {
    const pending = entries().filter((e) => e.status === "pending");
    if (pending.length === 0) return;

    setPhase("uploading");
    setWorkflowError(null);
    local.onStart?.(files());

    const results: Array<{ file: File; status: FileItemStatus }> = [];

    for (const entry of pending) {
      if (phase() !== "uploading") break;

      const file = files()[entry.index];
      if (!file) continue;

      const ctrl = new AbortController();
      abortControllers.set(entry.id, ctrl);
      updateEntry(entry.id, { status: "uploading", progress: 0 });

      try {
        await local.onUpload(
          file,
          (loaded, total) => {
            const fraction = total > 0 ? Math.min(1, loaded / total) : 0;
            updateEntry(entry.id, {
              progress: fraction,
              uploadedBytes: loaded,
            });
            local.onUploadProgress?.(buildBatchProgress());
          },
          ctrl.signal,
        );
        updateEntry(entry.id, { status: "done", progress: 1, uploadedBytes: file.size });
        results.push({ file, status: "success" });
        local.onFileComplete?.(file, "success");
      } catch (err: unknown) {
        if ((err as DOMException)?.name === "AbortError") {
          updateEntry(entry.id, { status: "pending", progress: 0, uploadedBytes: 0 });
          results.push({ file, status: "cancelled" });
        } else {
          const message = getErrorMessage(err, "Upload failed");
          updateEntry(entry.id, { status: "error" });
          results.push({ file, status: "error" });
          local.onError?.({ message, file });
          local.onFileComplete?.(file, "error", { message, file });
        }
      } finally {
        abortControllers.delete(entry.id);
      }
    }

    const hasErrors = results.some((r) => r.status === "error");
    setPhase(hasErrors ? "error" : "completed");
    local.onComplete?.(results);

    if (local.clearOnComplete && !hasErrors) {
      setTimeout(resetAll, 2000);
    }
  }

  function cancelAll() {
    for (const ctrl of abortControllers.values()) ctrl.abort();
    abortControllers.clear();
    setEntries((prev) =>
      prev.map((e) =>
        e.status === "uploading"
          ? { ...e, status: "pending" as const, progress: 0, uploadedBytes: 0 }
          : e,
      ),
    );
    setPhase("review");
    local.onCancel?.();
  }

  function buildBatchProgress(): BatchProgress {
    const items = entries();
    const tb = calculateTotalSize(files());
    const ub = calculateUploadedBytes(items);
    return {
      totalBytes: tb,
      uploadedBytes: ub,
      fraction: tb > 0 ? ub / tb : 0,
      files: items.map((e) => ({ name: e.name, fraction: e.progress })),
    };
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
        multiple={maxFiles() > 1}
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
        aria-label={local.label ?? "Click or drag to upload"}
        aria-disabled={local.disabled}
      >
        <div class="flex flex-col items-center gap-2">
          {local.icon ?? <Upload class="size-8" />}
          <span class="text-sm font-medium">{local.label ?? "Click or drag to upload"}</span>
          <Show when={local.hint}>
            <span class="text-xs text-muted-foreground">{local.hint}</span>
          </Show>
        </div>
      </div>

      <Show when={showList() && entries().length > 0}>
        <FileUploadList
          entries={entries()}
          overallProgress={overallProgress()}
          onRemoveEntry={phase() === "review" ? removeEntry : undefined}
          onRetryEntry={phase() === "completed" || phase() === "error" ? retryEntry : undefined}
        />
      </Show>

      <Show when={phase() === "error" && workflowError()}>
        <div class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {workflowError()}
        </div>
      </Show>

      <Show when={entries().length > 0}>
        <div class="flex items-center gap-2">
          <Show when={phase() === "review"}>
            <Button variant="outline" size="sm" class="text-xs" onClick={resetAll}>
              Clear all
            </Button>
            <Button
              variant="default"
              size="sm"
              class="text-xs"
              onClick={uploadPending}
              disabled={!entries().some((e) => e.status === "pending")}
            >
              Upload
            </Button>
          </Show>

          <Show when={phase() === "uploading"}>
            <Button variant="outline" size="sm" class="text-xs" onClick={cancelAll}>
              Cancel
            </Button>
          </Show>

          <Show when={phase() === "completed" || phase() === "error"}>
            <Button variant="outline" size="sm" class="text-xs" onClick={resetAll}>
              Clear all
            </Button>
            <Show when={entries().some((e) => e.status === "error")}>
              <Button variant="default" size="sm" class="text-xs" onClick={retryAllFailed}>
                Retry failed
              </Button>
            </Show>
          </Show>

          <span class="ml-auto text-xs text-muted-foreground">
            {entries().length} file{entries().length !== 1 ? "s" : ""}
            <Show when={local.maxSize}>
              <span> · max {formatBytes(local.maxSize!)} per file</span>
            </Show>
          </span>
        </div>
      </Show>
    </div>
  );
}
