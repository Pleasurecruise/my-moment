import type { Category, Rating } from "./types";
import { CATEGORY_CONFIG, RATING_CONFIG } from "./types";

/**
 * formatPrice — 将数字价格格式化为中文习惯的显示格式
 */
export function formatPrice(price: number): string {
  if (price >= 10000) {
    const wan = price / 10000;
    return `¥${wan % 1 === 0 ? wan.toFixed(0) : wan.toFixed(1)}w`;
  }
  return `¥${price % 1 === 0 ? price.toFixed(0) : price.toFixed(2)}`;
}

/**
 * formatDate — 将 ISO 日期字符串格式化为 "yyyy.MM.dd" 显示格式
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
 * timeAgo — 将时间戳转为相对时间描述，如 "3 天前"
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
      return `${days} 天前`;
    } else if (hours > 0) {
      return `${hours} 小时前`;
    } else if (minutes > 0) {
      return `${minutes} 分钟前`;
    } else {
      return "刚刚";
    }
  } catch {
    return "";
  }
}

/**
 * getRatingConfig — 获取评级的展示配置
 */
export function getRatingConfig(rating: Rating) {
  return RATING_CONFIG[rating];
}

/**
 * getCategoryConfig — 获取分类的展示配置
 */
export function getCategoryConfig(category: Category) {
  return CATEGORY_CONFIG[category];
}

/**
 * compressImage — 将用户上传的图片压缩并转为 base64 WebP
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
        if (!ctx) return reject(new Error("Canvas 不可用"));

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/webp", quality));
      };
      img.onerror = () => reject(new Error("图片加载失败"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("文件读取失败"));
    reader.readAsDataURL(file);
  });
}
