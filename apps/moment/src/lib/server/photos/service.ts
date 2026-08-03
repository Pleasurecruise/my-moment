import { photoUploadSchema } from "~/types/photo";
import type { PhotoItem } from "~/types";
import { deletePhotoObjects, storePhotoObjects } from "./storage";
import {
  createPhoto,
  deletePhoto as deletePhotoMetadata,
  getPhoto,
  listPhotos,
  updatePhoto,
} from "./repository";

export { createPhoto, getPhoto, listPhotos, updatePhoto };

export type CreatePhotoFromUploadResult =
  | { ok: true; photo: PhotoItem }
  | { ok: false; error: string };

function formString(form: FormData, key: string): string | undefined {
  const value = form.get(key);
  return typeof value === "string" ? value : undefined;
}

function formJson(form: FormData, key: string, fallback: unknown): unknown {
  const value = formString(form, key);
  return value ? JSON.parse(value) : fallback;
}

export async function createPhotoFromUpload(
  d1: D1Database,
  bucket: R2Bucket,
  userId: string,
  form: FormData,
): Promise<CreatePhotoFromUploadResult> {
  const file = form.get("file");
  const thumbnail = form.get("thumbnail");
  if (!(file instanceof File)) return { ok: false, error: "No file provided" };

  const parsedJson = {
    geo: formJson(form, "geo", undefined),
    tags: formJson(form, "tags", []),
  };

  const parsed = photoUploadSchema.safeParse({
    title: formString(form, "title"),
    description: formString(form, "description"),
    date: formString(form, "date"),
    geo: parsedJson.geo,
    tags: parsedJson.tags,
    thumbHash: formString(form, "thumbHash"),
    width: formString(form, "width"),
    height: formString(form, "height"),
    aspectRatio: formString(form, "aspectRatio"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid photo metadata" };
  }

  const stored = await storePhotoObjects(
    bucket,
    file,
    thumbnail instanceof File ? thumbnail : null,
  );

  try {
    const input = parsed.data;
    const photo = await createPhoto(d1, userId, {
      ...stored,
      thumbHash: input.thumbHash,
      title: input.title || file.name,
      width: input.width,
      height: input.height,
      aspectRatio: input.aspectRatio,
      size: file.size,
      format: file.name.split(".").pop()?.toUpperCase() || "PNG",
      date: input.date || new Date().toISOString(),
      description: input.description || "",
      geo: input.geo,
      tags: input.tags,
    });
    return { ok: true, photo };
  } catch (error) {
    await deletePhotoObjects(bucket, stored);
    throw error;
  }
}

export async function deletePhoto(d1: D1Database, bucket: R2Bucket, id: string): Promise<boolean> {
  const photo = await getPhoto(d1, id);
  if (!photo) return false;

  await deletePhotoObjects(bucket, photo);
  return deletePhotoMetadata(d1, id);
}
