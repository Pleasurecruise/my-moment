import { CATEGORY_CONFIG, RATING_CONFIG, type Category, type Rating } from "~/types/haul";

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
