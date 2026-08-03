import type { PhotoItem } from "~/types";

const PHOTO_ROUTE_PREFIX = "/api/photos/";

export interface StoredPhotoObjects {
  url: string;
  thumbnailUrl: string;
}

export async function storePhotoObjects(
  bucket: R2Bucket,
  file: File,
  thumbnail: File | null,
): Promise<StoredPhotoObjects> {
  let maxNumber = 0;
  let cursor: string | undefined;

  do {
    const listed = await bucket.list({ prefix: "img/image", cursor });
    for (const object of listed.objects) {
      const match = object.key.match(/^img\/image(\d+)\./);
      if (match) maxNumber = Math.max(maxNumber, Number(match[1]));
    }
    cursor = listed.truncated ? listed.cursor : undefined;
  } while (cursor);

  const number = maxNumber + 1;
  const imageKey = `img/image${number}.png`;
  const thumbnailKey = `img/thumbnails/image${number}.jpg`;
  const [imageBuffer, thumbnailBuffer] = await Promise.all([
    file.arrayBuffer(),
    thumbnail ? thumbnail.arrayBuffer() : file.arrayBuffer(),
  ]);

  await Promise.all([
    bucket.put(imageKey, imageBuffer, { httpMetadata: { contentType: "image/png" } }),
    bucket.put(thumbnailKey, thumbnailBuffer, { httpMetadata: { contentType: "image/jpeg" } }),
  ]);

  return {
    url: `/api/photos/image${number}.png`,
    thumbnailUrl: `/api/photos/${thumbnailKey}`,
  };
}

export function photoObjectKeyFromUrl(value: string): string | null {
  if (!value.startsWith(PHOTO_ROUTE_PREFIX)) return null;

  const filename = value.slice(PHOTO_ROUTE_PREFIX.length);
  if (!filename || /[\\%?#]/.test(filename)) return null;

  const key = filename.startsWith("img/") ? filename : `img/${filename}`;
  if (key.split("/").some((segment) => segment === "." || segment === "..")) return null;

  return key;
}

export async function deletePhotoObjects(
  bucket: R2Bucket,
  photo: Pick<PhotoItem, "url" | "thumbnailUrl">,
): Promise<void> {
  const imageKey = photoObjectKeyFromUrl(photo.url);
  const thumbnailKey = photoObjectKeyFromUrl(photo.thumbnailUrl);

  if (!imageKey || !thumbnailKey) {
    throw new Error("Photo has an invalid R2 object URL");
  }

  await bucket.delete([...new Set([imageKey, thumbnailKey])]);
}
