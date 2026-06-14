export type FileUploadStatus =
  | "pending"
  | "uploading"
  | "uploaded"
  | "processing"
  | "done"
  | "error";

export interface FileProgressEntry {
  index: number;
  id: string;
  name: string;
  size: number;
  status: FileUploadStatus;
  uploadedBytes: number;
  progress: number;
  previewUrl: string | null;
}

export type PreviewCache = Map<string, string | null>;

export type WorkflowPhase = "review" | "uploading" | "processing" | "completed" | "error";

export interface UploadWorkflowState {
  phase: WorkflowPhase;
  error: string | null;
}
