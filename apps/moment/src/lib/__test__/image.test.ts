import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  parseExif: vi.fn(),
  isHeic: vi.fn(),
  heicTo: vi.fn(),
}));

vi.mock("exifr", () => ({ default: { parse: mocks.parseExif } }));
vi.mock("heic-to", () => ({ isHeic: mocks.isHeic, heicTo: mocks.heicTo }));
vi.mock("thumbhash", () => ({ rgbaToThumbHash: () => new Uint8Array([1, 2, 3]) }));

import { isAcceptedImageFile, processImage } from "../image";

function file(name: string, type = "") {
  return { name, type };
}

describe("image file detection", () => {
  it("accepts HEIC and HEIF MIME types", () => {
    expect(isAcceptedImageFile(file("photo", "image/heic"))).toBe(true);
    expect(isAcceptedImageFile(file("photo", "image/heif"))).toBe(true);
  });

  it("accepts HEIC and HEIF extensions when browsers omit the MIME type", () => {
    expect(isAcceptedImageFile(file("IMG_0001.HEIC"))).toBe(true);
    expect(isAcceptedImageFile(file("portrait.heif", "application/octet-stream"))).toBe(true);
  });

  it("continues to accept regular images", () => {
    expect(isAcceptedImageFile(file("photo.jpg", "image/jpeg"))).toBe(true);
  });

  it("rejects unrelated files and misleading suffixes", () => {
    expect(isAcceptedImageFile(file("notes.txt", "text/plain"))).toBe(false);
    expect(isAcceptedImageFile(file("photo.heic.txt"))).toBe(false);
  });
});

describe("image processing", () => {
  let objectUrlCount = 0;

  beforeEach(() => {
    objectUrlCount = 0;
    mocks.isHeic.mockResolvedValue(true);
    mocks.heicTo.mockResolvedValue(new Blob(["jpeg"], { type: "image/jpeg" }));

    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => (objectUrlCount++ === 0 ? "blob:original" : "blob:converted")),
      revokeObjectURL: vi.fn(),
    });

    vi.stubGlobal(
      "Image",
      class {
        onload: (() => void) | null = null;
        onerror: ((error: unknown) => void) | null = null;
        naturalWidth = 120;
        naturalHeight = 80;
        width = 120;
        height = 80;

        set src(value: string) {
          queueMicrotask(() => {
            if (value === "blob:original") this.onerror?.(new Error("Unknown file format"));
            else this.onload?.();
          });
        }
      },
    );

    vi.stubGlobal("document", {
      createElement: () => {
        const canvas = {
          width: 0,
          height: 0,
          getContext: () => context,
          toBlob: (callback: (blob: Blob) => void, type: string) =>
            callback(new Blob(["image"], { type })),
        };
        const context = {
          canvas,
          drawImage: vi.fn(),
          getImageData: () => ({
            data: new Uint8ClampedArray(canvas.width * canvas.height * 4),
          }),
        };
        return canvas;
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("continues after optional EXIF parsing rejects a decoded HEIC file", async () => {
    const exifError = new Error("Unknown file format");
    mocks.parseExif.mockRejectedValue(exifError);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const heic = Object.assign(new Blob(["heic"], { type: "image/heic" }), {
      name: "IMG_0252.HEIC",
    }) as File;

    const result = await processImage(heic);

    expect(result).toMatchObject({
      width: 120,
      height: 80,
      aspectRatio: 1.5,
      exifDate: null,
      exifGeo: null,
    });
    expect(mocks.heicTo).toHaveBeenCalledWith({
      blob: heic,
      type: "image/jpeg",
      quality: 1,
    });
    expect(warn).toHaveBeenCalledWith("Failed to read optional EXIF metadata", exifError);
  });

  it("uses normalized EXIF date and GPS coordinates", async () => {
    mocks.parseExif.mockResolvedValue({
      DateTimeOriginal: new Date("2026-08-02T12:34:56.000Z"),
      GPSLatitude: [31, 13, 45],
      GPSLongitude: [121, 28, 30],
      latitude: 31.229167,
      longitude: 121.475,
    });
    const heic = Object.assign(new Blob(["heic"], { type: "image/heic" }), {
      name: "IMG_0252.HEIC",
    }) as File;

    const result = await processImage(heic);

    expect(result.exifDate).toBe("2026-08-02T12:34:56.000Z");
    expect(result.exifGeo).toEqual({ lat: 31.229167, lng: 121.475 });
  });
});
