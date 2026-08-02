import type { FileUploadStatus } from "~/types";

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
  uploaded: "text-info",
  processing: "text-warning",
  done: "text-success",
  error: "text-destructive",
};
