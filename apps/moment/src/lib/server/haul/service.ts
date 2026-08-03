import { deleteCollectionImage, uploadCollectionImage } from "../collection/storage";
import {
  createHaulItem,
  deleteHaulItem as deleteHaulItemMetadata,
  getHaulItem,
  getOwnedHaulItem,
  listAllHaulItems,
  updateHaulItem,
} from "./repository";

export { createHaulItem, getHaulItem, listAllHaulItems, updateHaulItem };

export const uploadHaulImage = (bucket: R2Bucket, value: FormDataEntryValue | null) =>
  uploadCollectionImage(bucket, "haul", value);

export async function deleteHaulItem(
  d1: D1Database,
  bucket: R2Bucket,
  userId: string,
  id: string,
): Promise<boolean> {
  const item = await getOwnedHaulItem(d1, userId, id);
  if (!item) return false;

  if (item.imageUrl) await deleteCollectionImage(bucket, "haul", item.imageUrl);
  return deleteHaulItemMetadata(d1, userId, id);
}
