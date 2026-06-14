import type { FileUploadStatus, WorkflowPhase } from "./types";

export const WORKFLOW_STEP_LABEL: Record<Exclude<WorkflowPhase, "error">, string> = {
  review: "Review",
  uploading: "Uploading",
  processing: "Processing",
  completed: "Done",
};

export const DISPLAY_STEPS: Array<Exclude<WorkflowPhase, "error">> = [
  "review",
  "uploading",
  "processing",
  "completed",
];

export const FILE_STATUS_LABEL: Record<FileUploadStatus, string> = {
  pending: "Pending",
  uploading: "Uploading",
  uploaded: "Uploaded",
  processing: "Processing",
  done: "Done",
  error: "Failed",
};

export const FILE_STATUS_CLASS: Record<FileUploadStatus, string> = {
  pending: "text-muted-foreground",
  uploading: "text-primary",
  uploaded: "text-sky-400",
  processing: "text-amber-400",
  done: "text-emerald-400",
  error: "text-red-400",
};
