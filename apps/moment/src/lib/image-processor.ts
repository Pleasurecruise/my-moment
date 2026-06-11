import { rgbaToThumbHash } from "thumbhash";
import exifr from "exifr";

const THUMBNAIL_WIDTH = 600;
const THUMBNAIL_QUALITY = 1.0;

export interface ImageProcessResult {
  image: Blob;
  thumbnail: Blob;
  width: number;
  height: number;
  aspectRatio: number;
  thumbHash: string | null;
  exifDate: string | null;
  exifGeo: { lat: number; lng: number } | null;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Failed to create blob"))),
      type,
      quality,
    );
  });
}

function drawToCanvas(
  img: HTMLImageElement,
  width: number,
  height: number,
): CanvasRenderingContext2D {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get 2d context");
  ctx.drawImage(img, 0, 0, width, height);
  return ctx;
}

function arrayBufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function generateThumbHash(img: HTMLImageElement): Promise<string | null> {
  const hashSize = 100;
  const scale = Math.min(1, hashSize / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);

  const ctx = drawToCanvas(img, w, h);
  const imageData = ctx.getImageData(0, 0, w, h);
  const hash = rgbaToThumbHash(w, h, imageData.data);
  return arrayBufferToHex(hash);
}

export async function processImage(file: File): Promise<ImageProcessResult> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const width = img.naturalWidth;
    const height = img.naturalHeight;
    const aspectRatio = width / height;

    // EXIF extraction
    const exif = await exifr.parse(file, {
      pick: ["DateTimeOriginal", "CreateDate", "ModifyDate", "GPSLatitude", "GPSLongitude"],
      gps: true,
    });

    const d = exif?.DateTimeOriginal ?? exif?.CreateDate ?? exif?.ModifyDate;
    const exifDate = d instanceof Date && !isNaN(d.getTime()) ? d.toISOString() : null;

    const lat = exif?.GPSLatitude;
    const lng = exif?.GPSLongitude;
    const exifGeo = typeof lat === "number" && typeof lng === "number" ? { lat, lng } : null;

    // Full-size image
    const imageCtx = drawToCanvas(img, width, height);
    const image = await canvasToBlob(imageCtx.canvas, "image/png");

    // Thumbnail
    const scale = Math.min(1, THUMBNAIL_WIDTH / Math.max(width, height));
    const thumbW = Math.round(width * scale);
    const thumbH = Math.round(height * scale);
    const thumbCtx = drawToCanvas(img, thumbW, thumbH);
    const thumbnail = await canvasToBlob(thumbCtx.canvas, "image/jpeg", THUMBNAIL_QUALITY);

    const thumbHash = await generateThumbHash(img);

    return { image, thumbnail, width, height, aspectRatio, thumbHash, exifDate, exifGeo };
  } finally {
    URL.revokeObjectURL(url);
  }
}
