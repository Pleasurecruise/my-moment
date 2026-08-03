import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPhoto, deletePhoto as deletePhotoMetadata, getPhoto } from "../photos/repository";
import { createPhotoFromUpload, deletePhoto } from "../photos/service";

vi.mock("../photos/repository", () => ({
  createPhoto: vi.fn(),
  deletePhoto: vi.fn(),
  getPhoto: vi.fn(),
  listPhotos: vi.fn(),
  updatePhoto: vi.fn(),
}));

const database = {} as D1Database;

function createBucket() {
  const list = vi.fn().mockResolvedValue({ objects: [], truncated: false });
  const put = vi.fn().mockResolvedValue(undefined);
  const remove = vi.fn().mockResolvedValue(undefined);
  const bucket = { list, put, delete: remove } as unknown as R2Bucket;
  return { bucket, list, put, remove };
}

function validUploadForm(): FormData {
  const form = new FormData();
  form.set("file", new File([new Uint8Array([1, 2, 3])], "photo.png", { type: "image/png" }));
  form.set("thumbnail", new File([new Uint8Array([4, 5])], "thumb.jpg", { type: "image/jpeg" }));
  form.set("title", "A moment");
  form.set("width", "1200");
  form.set("height", "800");
  form.set("aspectRatio", "1.5");
  form.set("tags", JSON.stringify(["Travel"]));
  return form;
}

describe("photo service create", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates metadata before uploading to R2", async () => {
    const form = validUploadForm();
    form.set("tags", "not-json");
    const { bucket, list, put } = createBucket();

    await expect(createPhotoFromUpload(database, bucket, "owner", form)).rejects.toThrow();
    expect(list).not.toHaveBeenCalled();
    expect(put).not.toHaveBeenCalled();
    expect(createPhoto).not.toHaveBeenCalled();
  });

  it("stores both images and creates database metadata", async () => {
    const form = validUploadForm();
    const { bucket, put, remove } = createBucket();
    const photo = {
      id: "photo-1",
      url: "/api/photos/image1.png",
      thumbnailUrl: "/api/photos/img/thumbnails/image1.jpg",
      title: "A moment",
      width: 1200,
      height: 800,
      tags: ["travel"],
    };
    vi.mocked(createPhoto).mockResolvedValue(photo);

    await expect(createPhotoFromUpload(database, bucket, "owner", form)).resolves.toEqual({
      ok: true,
      photo,
    });
    expect(put).toHaveBeenCalledTimes(2);
    expect(createPhoto).toHaveBeenCalledWith(
      database,
      "owner",
      expect.objectContaining({
        url: "/api/photos/image1.png",
        thumbnailUrl: "/api/photos/img/thumbnails/image1.jpg",
        title: "A moment",
        width: 1200,
        height: 800,
        tags: ["travel"],
      }),
    );
    expect(remove).not.toHaveBeenCalled();
  });

  it("rolls back uploaded images when database creation fails", async () => {
    const form = validUploadForm();
    const { bucket, remove } = createBucket();
    vi.mocked(createPhoto).mockRejectedValue(new Error("D1 unavailable"));

    await expect(createPhotoFromUpload(database, bucket, "owner", form)).rejects.toThrow(
      "D1 unavailable",
    );
    expect(remove).toHaveBeenCalledWith(["img/image1.png", "img/thumbnails/image1.jpg"]);
  });
});

describe("photo service delete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns false without touching R2 when the photo does not exist", async () => {
    vi.mocked(getPhoto).mockResolvedValue(null);
    const { bucket, remove } = createBucket();

    await expect(deletePhoto(database, bucket, "missing")).resolves.toBe(false);
    expect(remove).not.toHaveBeenCalled();
    expect(deletePhotoMetadata).not.toHaveBeenCalled();
  });

  it("deletes R2 objects before deleting database metadata", async () => {
    vi.mocked(getPhoto).mockResolvedValue({
      id: "photo-1",
      url: "/api/photos/image1.png",
      thumbnailUrl: "/api/photos/img/thumbnails/image1.jpg",
      title: "Photo",
      width: 100,
      height: 100,
      tags: [],
    });
    vi.mocked(deletePhotoMetadata).mockResolvedValue(true);
    const { bucket, remove } = createBucket();

    await expect(deletePhoto(database, bucket, "photo-1")).resolves.toBe(true);
    expect(remove).toHaveBeenCalledWith(["img/image1.png", "img/thumbnails/image1.jpg"]);
    expect(deletePhotoMetadata).toHaveBeenCalledWith(database, "photo-1");
    expect(remove.mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(deletePhotoMetadata).mock.invocationCallOrder[0]!,
    );
  });

  it("keeps database metadata when R2 deletion fails", async () => {
    vi.mocked(getPhoto).mockResolvedValue({
      id: "photo-1",
      url: "/api/photos/image1.png",
      thumbnailUrl: "/api/photos/img/thumbnails/image1.jpg",
      title: "Photo",
      width: 100,
      height: 100,
      tags: [],
    });
    const failure = new Error("R2 unavailable");
    const remove = vi.fn().mockRejectedValue(failure);
    const bucket = { delete: remove } as unknown as R2Bucket;

    await expect(deletePhoto(database, bucket, "photo-1")).rejects.toThrow("R2 unavailable");
    expect(deletePhotoMetadata).not.toHaveBeenCalled();
  });
});
