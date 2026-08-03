import { describe, expect, it, vi } from "vitest";
import { deletePhotoObjects, photoObjectKeyFromUrl } from "../photos/storage";

describe("photoObjectKeyFromUrl", () => {
  it.each([
    ["/api/photos/image12.png", "img/image12.png"],
    ["/api/photos/img/thumbnails/image12.jpg", "img/thumbnails/image12.jpg"],
  ])("maps %s to its R2 key", (url, expected) => {
    expect(photoObjectKeyFromUrl(url)).toBe(expected);
  });

  it.each([
    "",
    "/images/photo.png",
    "/api/photos/../private.txt",
    "/api/photos/%2e%2e/private.txt",
  ])("rejects unmanaged or unsafe URL %s", (url) => {
    expect(photoObjectKeyFromUrl(url)).toBeNull();
  });
});

describe("deletePhotoObjects", () => {
  it("deletes the original image and thumbnail together", async () => {
    const remove = vi.fn().mockResolvedValue(undefined);
    const bucket = { delete: remove } as unknown as R2Bucket;

    await deletePhotoObjects(bucket, {
      url: "/api/photos/image8.png",
      thumbnailUrl: "/api/photos/img/thumbnails/image8.jpg",
    });

    expect(remove).toHaveBeenCalledOnce();
    expect(remove).toHaveBeenCalledWith(["img/image8.png", "img/thumbnails/image8.jpg"]);
  });

  it("does not touch R2 when either URL cannot be mapped", async () => {
    const remove = vi.fn();
    const bucket = { delete: remove } as unknown as R2Bucket;

    await expect(
      deletePhotoObjects(bucket, {
        url: "/api/photos/image8.png",
        thumbnailUrl: "https://cdn.example/thumbnail.jpg",
      }),
    ).rejects.toThrow("invalid R2 object URL");
    expect(remove).not.toHaveBeenCalled();
  });
});
