import { describe, expect, it, vi } from "vitest";
import {
  collectionImageKeyFromUrl,
  deleteCollectionImage,
  uploadCollectionImage,
} from "../collection/storage";

function createBucket() {
  const list = vi.fn();
  const put = vi.fn();
  const remove = vi.fn();
  return { bucket: { list, put, delete: remove } as unknown as R2Bucket, list, put, remove };
}

describe("collection image deletion", () => {
  it("maps only images belonging to the requested collection", () => {
    expect(collectionImageKeyFromUrl("/api/photos/haul/image02.webp", "haul")).toBe(
      "img/haul/image02.webp",
    );
    expect(collectionImageKeyFromUrl("/api/photos/wishlist/image02.webp", "haul")).toBeNull();
    expect(collectionImageKeyFromUrl("/api/photos/haul/../private.txt", "haul")).toBeNull();
  });

  it("deletes the mapped R2 object", async () => {
    const { bucket, remove } = createBucket();
    remove.mockResolvedValue(undefined);

    await deleteCollectionImage(bucket, "wishlist", "/api/photos/wishlist/image04.png");

    expect(remove).toHaveBeenCalledWith("img/wishlist/image04.png");
  });

  it("rejects invalid URLs without touching R2", async () => {
    const { bucket, remove } = createBucket();

    await expect(
      deleteCollectionImage(bucket, "haul", "https://cdn.example/image.jpg"),
    ).rejects.toThrow("Invalid haul image URL");
    expect(remove).not.toHaveBeenCalled();
  });
});

describe("uploadCollectionImage", () => {
  it("rejects missing files without touching R2", async () => {
    const { bucket, list, put } = createBucket();

    await expect(uploadCollectionImage(bucket, "haul", null)).resolves.toEqual({
      ok: false,
      error: "No file provided",
    });
    expect(list).not.toHaveBeenCalled();
    expect(put).not.toHaveBeenCalled();
  });

  it("rejects unsupported image types", async () => {
    const { bucket, list } = createBucket();
    const file = new File(["plain text"], "notes.txt", { type: "text/plain" });

    const result = await uploadCollectionImage(bucket, "wishlist", file);

    expect(result).toEqual({
      ok: false,
      error: "Invalid file type. Allowed: JPG, PNG, WebP, GIF, AVIF",
    });
    expect(list).not.toHaveBeenCalled();
  });

  it("uses the next number across paginated R2 listings and preserves the image type", async () => {
    const { bucket, list, put } = createBucket();
    list
      .mockResolvedValueOnce({
        objects: [{ key: "img/haul/image02.jpg" }, { key: "img/haul/ignored.txt" }],
        truncated: true,
        cursor: "next-page",
      })
      .mockResolvedValueOnce({
        objects: [{ key: "img/haul/image11.webp" }],
        truncated: false,
      });
    put.mockResolvedValue(undefined);
    const file = new File([new Uint8Array([1, 2, 3])], "photo.webp", {
      type: "image/webp",
    });

    const result = await uploadCollectionImage(bucket, "haul", file);

    expect(result).toEqual({
      ok: true,
      key: "img/haul/image12.webp",
      url: "/api/photos/haul/image12.webp",
    });
    expect(list).toHaveBeenNthCalledWith(1, {
      prefix: "img/haul/image",
      cursor: undefined,
    });
    expect(list).toHaveBeenNthCalledWith(2, {
      prefix: "img/haul/image",
      cursor: "next-page",
    });
    expect(put).toHaveBeenCalledWith("img/haul/image12.webp", expect.any(ArrayBuffer), {
      httpMetadata: { contentType: "image/webp" },
    });
  });
});
