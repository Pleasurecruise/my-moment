import { createFileRoute, useNavigate } from "@tanstack/solid-router";

import { Upload, ArrowLeft } from "lucide-solid";
import { Button } from "@my-moment/ui";
import { BatchPhotoUpload } from "~/components/BatchPhotoUpload";
import type { BatchUploadHandler } from "~/components/BatchPhotoUpload";

export const Route = createFileRoute("/upload")({
  component: UploadPage,
});

function UploadPage() {
  const navigate = useNavigate();

  const handleUpload: BatchUploadHandler = async (file, reportProgress, signal) => {
    const form = new FormData();
    form.append("file", file);

    const res = await fetch("/api/photos/upload", {
      method: "POST",
      body: form,
      signal,
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(body || `Upload failed: ${res.status}`);
    }

    reportProgress(file.size, file.size);
  };

  return (
    <div class="mx-auto max-w-2xl space-y-6">
      <div class="flex items-center gap-3">
        <Button variant="ghost" size="icon" class="size-8" onClick={() => navigate({ to: "/" })}>
          <ArrowLeft size={16} />
        </Button>
        <div class="flex items-center gap-2">
          <Upload size={18} class="text-muted-foreground" />
          <h1 class="text-lg font-semibold">Upload Photos</h1>
        </div>
      </div>

      <BatchPhotoUpload
        onUpload={handleUpload}
        accept="image/*"
        maxSize={20 * 1024 * 1024}
        maxFiles={20}
        hint="Supports JPG, PNG, WebP, GIF, AVIF — max 20MB per file"
        clearOnComplete
        onComplete={(results) => {
          const ok = results.filter((r) => r.status === "success").length;
          if (ok > 0) {
            // invalidate gallery cache so new photos appear on return
            fetch("/api/gallery/invalidate").catch(() => {});
          }
        }}
      />
    </div>
  );
}
