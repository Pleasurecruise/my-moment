import { createFileRoute, useNavigate } from "@tanstack/solid-router";

import { Upload, ArrowLeft } from "lucide-solid";
import { createSignal } from "solid-js";
import { Button, TagInput, toast } from "@my-moment/ui";
import { BatchPhotoUpload } from "~/components/upload";
import type { BatchUploadHandler } from "~/components/upload";
import { processImage } from "~/lib/image-processor";

export const Route = createFileRoute("/upload")({
  component: UploadPage,
});

function UploadPage() {
  const navigate = useNavigate();
  const [tags, setTags] = createSignal<string[]>([]);
  const [triggerUpload, setTriggerUpload] = createSignal(false);
  const [hasFiles, setHasFiles] = createSignal(false);

  const handleUpload: BatchUploadHandler = async (file, reportProgress, signal) => {
    const processed = await processImage(file);

    const form = new FormData();
    form.append("file", processed.image, file.name.replace(/\.[^.]+$/, ".png"));
    form.append("thumbnail", processed.thumbnail, "thumbnail.jpg");
    form.append("width", String(processed.width));
    form.append("height", String(processed.height));
    form.append("aspectRatio", String(processed.aspectRatio));
    if (processed.thumbHash) {
      form.append("thumbHash", processed.thumbHash);
    }
    if (processed.exifDate) {
      form.append("exifDate", processed.exifDate);
    }
    if (processed.exifGeo) {
      form.append("exifGeo", JSON.stringify(processed.exifGeo));
    }
    if (tags().length > 0) {
      form.append("tags", JSON.stringify(tags()));
    }

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
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <Button variant="ghost" size="icon" class="size-8" onClick={() => navigate({ to: "/" })}>
            <ArrowLeft size={16} />
          </Button>
          <div class="flex items-center gap-2">
            <Upload size={18} class="text-muted-foreground" />
            <h1 class="text-lg font-semibold">Upload Photos</h1>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => setTriggerUpload(true)}
          disabled={!hasFiles()}
        >
          Publish
        </Button>
      </div>

      <div>
        <label class="mb-1.5 block text-xs font-medium text-muted-foreground">Tags</label>
        <TagInput
          value={tags()}
          onChange={setTags}
          placeholder="Add tags (press Enter or comma to add)"
          maxTags={10}
        />
        <p class="mt-1 text-[11px] text-muted-foreground">
          Tags will be applied to all uploaded photos
        </p>
      </div>

      <BatchPhotoUpload
        onUpload={handleUpload}
        accept="image/*"
        maxSize={20 * 1024 * 1024}
        maxFiles={20}
        hint="Supports JPG, PNG, WebP, GIF, AVIF — max 20MB per file"
        clearOnComplete
        triggerUpload={triggerUpload}
        onUploadTriggered={() => setTriggerUpload(false)}
        onFilesChange={(files) => setHasFiles(files.length > 0)}
        onComplete={(results) => {
          const ok = results.filter((r) => r.status === "success").length;
          const failed = results.filter((r) => r.status === "error").length;

          if (ok > 0) {
            toast.success(`${ok} photo${ok > 1 ? "s" : ""} uploaded successfully`);
            setHasFiles(false);
            setTags([]);
          }
          if (failed > 0) {
            toast.error(`Failed to upload ${failed} photo${failed > 1 ? "s" : ""}`);
          }
        }}
      />
    </div>
  );
}
