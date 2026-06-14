import type { Category, Rating } from "./types";
import { CATEGORY_CONFIG, RATING_CONFIG } from "./types";

/**
 * Format price for display (e.g. ¥1899, ¥1.2w)
 */
export function formatPrice(price: number): string {
  if (price >= 10000) {
    const wan = price / 10000;
    return `¥${wan % 1 === 0 ? wan.toFixed(0) : wan.toFixed(1)}w`;
  }
  return `¥${price % 1 === 0 ? price.toFixed(0) : price.toFixed(2)}`;
}

/**
 * Format ISO date string to "yyyy.MM.dd"
 */
export function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}.${month}.${day}`;
  } catch {
    return dateStr;
  }
}

/**
 * Convert timestamp to relative time (e.g. "3 days ago")
 */
export function timeAgo(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 30) {
      return formatDate(dateStr);
    } else if (days > 0) {
      return `${days} days ago`;
    } else if (hours > 0) {
      return `${hours} hours ago`;
    } else if (minutes > 0) {
      return `${minutes} minutes ago`;
    } else {
      return "just now";
    }
  } catch {
    return "";
  }
}

/**
 * Get rating display config
 */
export function getRatingConfig(rating: Rating) {
  return RATING_CONFIG[rating];
}

/**
 * Get category display config
 */
export function getCategoryConfig(category: Category) {
  return CATEGORY_CONFIG[category];
}

/**
 * Compress uploaded image to base64 WebP
 */
export function compressImage(file: File, maxWidth = 800, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas unavailable"));

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/webp", quality));
      };
      img.onerror = () => reject(new Error("Image load failed"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("File read failed"));
    reader.readAsDataURL(file);
  });
}
