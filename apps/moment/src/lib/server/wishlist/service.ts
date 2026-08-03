import { deleteCollectionImage, uploadCollectionImage } from "../collection/storage";
import {
  convertWishlistItem,
  createWishlistItem,
  deleteWishlistItem as deleteWishlistItemMetadata,
  getOwnedWishlistItem,
  getWishlistItem,
  listAllWishlistItems,
  updateWishlistItem,
} from "./repository";

export {
  convertWishlistItem,
  createWishlistItem,
  getWishlistItem,
  listAllWishlistItems,
  updateWishlistItem,
};

export const uploadWishlistImage = (bucket: R2Bucket, value: FormDataEntryValue | null) =>
  uploadCollectionImage(bucket, "wishlist", value);

export async function deleteWishlistItem(
  d1: D1Database,
  bucket: R2Bucket,
  userId: string,
  id: string,
): Promise<boolean> {
  const item = await getOwnedWishlistItem(d1, userId, id);
  if (!item) return false;

  if (item.imageUrl) await deleteCollectionImage(bucket, "wishlist", item.imageUrl);
  return deleteWishlistItemMetadata(d1, userId, id);
}
