import { rgbaToThumbHash } from "thumbhash";

const THUMBNAIL_WIDTH = 600;
const THUMBNAIL_QUALITY = 1.0;

export interface ImageProcessResult {
  image: Blob;
  thumbnail: Blob;
  width: number;
  height: number;
  aspectRatio: number;
  thumbHash: string | null;
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

function arrayBufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function generateThumbHash(img: HTMLImageElement): Promise<string | null> {
  try {
    const hashSize = 100;
    const scale = Math.min(1, hashSize / Math.max(img.width, img.height));
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, w, h);

    const imageData = ctx.getImageData(0, 0, w, h);
    const hash = rgbaToThumbHash(w, h, imageData.data);
    return arrayBufferToHex(hash);
  } catch (err) {
    console.warn("ThumbHash generation failed:", err);
    return null;
  }
}

export async function processImage(file: File): Promise<ImageProcessResult> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const { width, height } = img;
    const aspectRatio = width / height;

    const imageCanvas = document.createElement("canvas");
    imageCanvas.width = width;
    imageCanvas.height = height;
    const imageCtx = imageCanvas.getContext("2d")!;
    imageCtx.drawImage(img, 0, 0, width, height);
    const image = await canvasToBlob(imageCanvas, "image/png");

    const scale = Math.min(1, THUMBNAIL_WIDTH / Math.max(width, height));
    const thumbW = Math.round(width * scale);
    const thumbH = Math.round(height * scale);

    const thumbCanvas = document.createElement("canvas");
    thumbCanvas.width = thumbW;
    thumbCanvas.height = thumbH;
    const thumbCtx = thumbCanvas.getContext("2d")!;
    thumbCtx.drawImage(img, 0, 0, thumbW, thumbH);
    const thumbnail = await canvasToBlob(thumbCanvas, "image/jpeg", THUMBNAIL_QUALITY);

    const thumbHash = await generateThumbHash(img);

    return { image, thumbnail, width, height, aspectRatio, thumbHash };
  } finally {
    URL.revokeObjectURL(url);
  }
}
