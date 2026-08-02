const IMAGE_EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
} as const;

const INVALID_IMAGE_TYPE_ERROR = "Invalid file type. Allowed: JPG, PNG, WebP, GIF, AVIF";

export type CollectionImageKind = "haul" | "wishlist";

export type CollectionImageResult =
  | { ok: true; key: string; url: string }
  | { ok: false; error: string };

export async function uploadCollectionImage(
  bucket: R2Bucket,
  kind: CollectionImageKind,
  value: FormDataEntryValue | null,
): Promise<CollectionImageResult> {
  if (!(value instanceof File)) return { ok: false, error: "No file provided" };

  const extension = IMAGE_EXTENSIONS[value.type as keyof typeof IMAGE_EXTENSIONS];
  if (!extension) return { ok: false, error: INVALID_IMAGE_TYPE_ERROR };

  const prefix = `img/${kind}/image`;
  const keyPattern = new RegExp(`^${prefix}(\\d+)\\.`);
  let maxNumber = 0;
  let cursor: string | undefined;

  do {
    const listed = await bucket.list({ prefix, cursor });
    for (const object of listed.objects) {
      const match = object.key.match(keyPattern);
      if (match) maxNumber = Math.max(maxNumber, Number(match[1]));
    }
    cursor = listed.truncated ? listed.cursor : undefined;
  } while (cursor);

  const number = String(maxNumber + 1).padStart(2, "0");
  const key = `${prefix}${number}.${extension}`;

  await bucket.put(key, await value.arrayBuffer(), {
    httpMetadata: { contentType: value.type },
  });

  return { ok: true, key, url: `/api/photos/${kind}/image${number}.${extension}` };
}
