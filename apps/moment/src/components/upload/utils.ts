import type { FileProgressEntry, PreviewCache } from "./types";

const PREVIEW_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/bmp",
  "image/avif",
]);

const PREVIEW_EXTENSIONS = new Set(["jpg", "jpeg", "png", "gif", "webp", "bmp", "avif"]);

const PREVIEW_SIZE_LIMIT_BYTES = 50 * 1024 * 1024;

function getFileExtension(name: string): string {
  const normalized = name.toLowerCase();
  const lastDotIndex = normalized.lastIndexOf(".");
  return lastDotIndex === -1 ? "" : normalized.slice(lastDotIndex + 1);
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }
  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const size = bytes / 1024 ** exponent;
  return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[exponent]}`;
}

export function entryFingerprint(file: File): string {
  return `${file.name}|${file.size}|${file.lastModified}`;
}

export function shouldGeneratePreview(file: File): boolean {
  if (file.size > PREVIEW_SIZE_LIMIT_BYTES) {
    return false;
  }
  const mime = file.type?.toLowerCase() ?? "";
  if (mime) {
    return PREVIEW_MIME_TYPES.has(mime);
  }
  return PREVIEW_EXTENSIONS.has(getFileExtension(file.name));
}

export function revokePreviewUrls(cache: PreviewCache, fingerprintsToRevoke?: string[]): void {
  if (fingerprintsToRevoke === undefined) {
    cache.forEach((url) => {
      if (url !== null) {
        URL.revokeObjectURL(url);
      }
    });
    cache.clear();
    return;
  }

  for (const fp of fingerprintsToRevoke) {
    const url = cache.get(fp);
    if (url) {
      URL.revokeObjectURL(url);
    }
    cache.delete(fp);
  }
}

export function primePreviewCache(files: File[], cache: PreviewCache): void {
  for (const file of files) {
    const fp = entryFingerprint(file);
    if (cache.has(fp)) {
      continue;
    }
    cache.set(fp, shouldGeneratePreview(file) ? URL.createObjectURL(file) : null);
  }
}

export function createFileEntries(files: File[], cache: PreviewCache): FileProgressEntry[] {
  return files.map((file, index) => {
    const id = entryFingerprint(file);
    return {
      index,
      id,
      name: file.name,
      size: file.size,
      status: "pending" as const,
      uploadedBytes: 0,
      progress: 0,
      previewUrl: cache.get(id) ?? null,
    };
  });
}

export function calculateTotalSize(files: File[]): number {
  return files.reduce((sum, file) => sum + file.size, 0);
}

export function calculateUploadedBytes(entries: FileProgressEntry[]): number {
  return entries.reduce((sum, entry) => sum + Math.min(entry.uploadedBytes, entry.size), 0);
}

export function createFileList(fileArray: File[]): FileList {
  if (typeof DataTransfer !== "undefined") {
    const transfer = new DataTransfer();
    fileArray.forEach((file) => transfer.items.add(file));
    return transfer.files;
  }

  const fallback: Record<number, File> & { length: number; item: (index: number) => File | null } =
    {
      length: fileArray.length,
      item: (index: number) => fileArray[index] ?? null,
    };

  fileArray.forEach((file, index) => {
    fallback[index] = file;
  });

  return fallback as unknown as FileList;
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === "object" && error && "message" in error) {
    const candidate = (error as { message?: unknown }).message;
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate;
    }
  }
  return fallback;
}
