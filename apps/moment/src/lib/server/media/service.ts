import { deleteCollectionImage, uploadCollectionImage } from "../collection/storage";
import { deleteMediaItemMetadata, getOwnedMediaItem } from "./repository";
import type { MediaKind } from "~/types";

export { createMediaItem, getMediaItem, listMediaItems, updateMediaItem } from "./repository";

export const uploadMediaImage = (
  bucket: R2Bucket,
  kind: MediaKind,
  value: FormDataEntryValue | null,
) => uploadCollectionImage(bucket, kind, value);

export async function deleteMediaItem(
  d1: D1Database,
  bucket: R2Bucket,
  userId: string,
  id: string,
): Promise<boolean> {
  const item = await getOwnedMediaItem(d1, userId, id);
  if (!item) return false;

  if (item.imageUrl) await deleteCollectionImage(bucket, item.kind, item.imageUrl);
  return deleteMediaItemMetadata(d1, userId, id);
}
