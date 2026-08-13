import { rgbaToThumbHash } from "thumbhash";
import { extractExifMetadata } from "./exif";

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

interface LoadedImage {
  image: HTMLImageElement;
  url: string;
}

export function isAcceptedImageFile(file: Pick<File, "name" | "type">): boolean {
  return file.type.toLowerCase().startsWith("image/") || /\.(heic|heif)$/i.test(file.name);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function decodeHeic(file: File): Promise<Blob | null> {
  const { heicTo, isHeic } = await import("heic-to");
  if (!(await isHeic(file))) return null;

  return heicTo({
    blob: file,
    type: "image/jpeg",
    quality: 1,
  });
}

async function loadImageFile(file: File): Promise<LoadedImage> {
  const originalUrl = URL.createObjectURL(file);
  try {
    return { image: await loadImage(originalUrl), url: originalUrl };
  } catch (nativeDecodeError) {
    URL.revokeObjectURL(originalUrl);

    let converted: Blob | null;
    try {
      converted = await decodeHeic(file);
    } catch (error) {
      throw new Error("Failed to decode HEIC/HEIF image", { cause: error });
    }

    if (!converted) throw nativeDecodeError;

    const convertedUrl = URL.createObjectURL(converted);
    try {
      return { image: await loadImage(convertedUrl), url: convertedUrl };
    } catch (error) {
      URL.revokeObjectURL(convertedUrl);
      throw error;
    }
  }
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

function generateThumbHash(img: HTMLImageElement): string {
  const hashSize = 100;
  const scale = Math.min(1, hashSize / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);

  const ctx = drawToCanvas(img, w, h);
  const imageData = ctx.getImageData(0, 0, w, h);
  const hash = rgbaToThumbHash(w, h, imageData.data);
  return Array.from(hash, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function processImage(file: File): Promise<ImageProcessResult> {
  const loaded = await loadImageFile(file);
  try {
    const img = loaded.image;
    const width = img.naturalWidth;
    const height = img.naturalHeight;
    const aspectRatio = width / height;

    let exifDate: string | null = null;
    let exifGeo: { lat: number; lng: number } | null = null;
    try {
      const metadata = await extractExifMetadata(file);
      exifDate = metadata.date;
      exifGeo = metadata.geo;
    } catch (error) {
      console.warn("Failed to read optional EXIF metadata", error);
    }

    // Full-size image
    const imageCtx = drawToCanvas(img, width, height);
    const image = await canvasToBlob(imageCtx.canvas, "image/png");

    // Thumbnail
    const scale = Math.min(1, THUMBNAIL_WIDTH / Math.max(width, height));
    const thumbW = Math.round(width * scale);
    const thumbH = Math.round(height * scale);
    const thumbCtx = drawToCanvas(img, thumbW, thumbH);
    const thumbnail = await canvasToBlob(thumbCtx.canvas, "image/jpeg", THUMBNAIL_QUALITY);

    const thumbHash = generateThumbHash(img);

    return { image, thumbnail, width, height, aspectRatio, thumbHash, exifDate, exifGeo };
  } finally {
    URL.revokeObjectURL(loaded.url);
  }
}
