import { Show, For } from "solid-js";
import { X, ImageOff } from "lucide-solid";
import type { FileProgressEntry } from "./types";
import { FILE_STATUS_LABEL, FILE_STATUS_CLASS } from "./constants";
import { formatBytes } from "./utils";

interface FileUploadListProps {
  entries: FileProgressEntry[];
  overallProgress: number;
  onRemoveEntry?: (entry: FileProgressEntry) => void;
  onRetryEntry?: (entry: FileProgressEntry) => void;
}

function FileUploadItemThumbnail(props: { entry: FileProgressEntry }) {
  return (
    <Show
      when={props.entry.previewUrl}
      fallback={
        <div class="flex size-10 shrink-0 items-center justify-center rounded bg-muted">
          <ImageOff class="size-5 text-muted-foreground" />
        </div>
      }
    >
      <img
        src={props.entry.previewUrl!}
        alt=""
        loading="lazy"
        decoding="async"
        class="size-10 shrink-0 rounded object-cover bg-muted/30"
      />
    </Show>
  );
}

export function FileUploadList(props: FileUploadListProps) {
  return (
    <div>
      <div class="flex items-center justify-between text-xs text-muted-foreground">
        <span>Upload progress</span>
        <span>{Math.round(props.overallProgress * 100)}%</span>
      </div>
      <div
        class="bg-muted/20 mt-2 h-2 rounded-full"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          class="bg-primary h-full rounded-full transition-all duration-300"
          style={{ width: `${Math.min(100, props.overallProgress * 100)}%` }}
        />
      </div>

      <ul class="mt-4 max-h-60 space-y-1 overflow-y-auto">
        <For each={props.entries}>
          {(entry) => (
            <li class="flex items-center gap-3 px-2 py-2 text-sm">
              <FileUploadItemThumbnail entry={entry} />
              <div class="min-w-0 flex-1">
                <span class="block truncate" title={entry.name}>
                  {entry.name}
                </span>
                <p class="text-[11px] text-muted-foreground">{formatBytes(entry.size)}</p>
                <div
                  class="bg-muted/20 mt-1.5 h-1.5 rounded-full"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(entry.progress * 100)}
                >
                  <div
                    class={
                      entry.status === "done"
                        ? "bg-emerald-400 h-full rounded-full"
                        : entry.status === "error"
                          ? "bg-red-400 h-full rounded-full"
                          : entry.status === "processing"
                            ? "bg-amber-300 h-full rounded-full"
                            : "bg-primary h-full rounded-full"
                    }
                    style={{ width: `${Math.min(100, entry.progress * 100)}%` }}
                  />
                </div>
              </div>
              <div class="flex shrink-0 items-center gap-1.5">
                <span class={`${FILE_STATUS_CLASS[entry.status]} text-[11px] font-medium`}>
                  {FILE_STATUS_LABEL[entry.status]}
                </span>
                <Show when={entry.status === "error" && props.onRetryEntry}>
                  <button
                    type="button"
                    class="text-[11px] text-primary hover:underline"
                    onClick={() => props.onRetryEntry?.(entry)}
                  >
                    Retry
                  </button>
                </Show>
                <Show
                  when={
                    props.onRemoveEntry && (entry.status === "pending" || entry.status === "error")
                  }
                >
                  <button
                    type="button"
                    class="text-muted-foreground hover:text-red-400 transition-colors"
                    aria-label="Remove file"
                    onClick={() => props.onRemoveEntry?.(entry)}
                  >
                    <X class="size-3" />
                  </button>
                </Show>
              </div>
            </li>
          )}
        </For>
      </ul>
    </div>
  );
}
