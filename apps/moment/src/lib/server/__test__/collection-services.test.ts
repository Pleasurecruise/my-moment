import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GoodsItem, WishItem } from "~/types";
import { deleteHaulItem as deleteHaulItemMetadata, getOwnedHaulItem } from "../haul/repository";
import { deleteHaulItem } from "../haul/service";
import {
  deleteWishlistItem as deleteWishlistItemMetadata,
  getOwnedWishlistItem,
} from "../wishlist/repository";
import { deleteWishlistItem } from "../wishlist/service";

vi.mock("../haul/repository", () => ({
  createHaulItem: vi.fn(),
  deleteHaulItem: vi.fn(),
  getHaulItem: vi.fn(),
  getOwnedHaulItem: vi.fn(),
  listAllHaulItems: vi.fn(),
  updateHaulItem: vi.fn(),
}));

vi.mock("../wishlist/repository", () => ({
  convertWishlistItem: vi.fn(),
  createWishlistItem: vi.fn(),
  deleteWishlistItem: vi.fn(),
  getOwnedWishlistItem: vi.fn(),
  getWishlistItem: vi.fn(),
  listAllWishlistItems: vi.fn(),
  updateWishlistItem: vi.fn(),
}));

const database = {} as D1Database;
const haulItem: GoodsItem = {
  id: "haul-1",
  name: "Headphones",
  price: 100,
  category: "audio",
  rating: "great",
  purchaseDate: "2026-01-01",
  comment: "Good",
  imageUrl: "/api/photos/haul/image01.webp",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};
const wishItem: WishItem = {
  id: "wish-1",
  name: "Camera",
  price: 500,
  category: "digital",
  imageUrl: "/api/photos/wishlist/image03.png",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

function createBucket() {
  const remove = vi.fn().mockResolvedValue(undefined);
  return { bucket: { delete: remove } as unknown as R2Bucket, remove };
}

describe("collection services", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes a haul image before its database record", async () => {
    vi.mocked(getOwnedHaulItem).mockResolvedValue(haulItem);
    vi.mocked(deleteHaulItemMetadata).mockResolvedValue(true);
    const { bucket, remove } = createBucket();

    await expect(deleteHaulItem(database, bucket, "owner", haulItem.id)).resolves.toBe(true);
    expect(remove).toHaveBeenCalledWith("img/haul/image01.webp");
    expect(deleteHaulItemMetadata).toHaveBeenCalledWith(database, "owner", haulItem.id);
    expect(remove.mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(deleteHaulItemMetadata).mock.invocationCallOrder[0]!,
    );
  });

  it("keeps haul metadata when R2 deletion fails", async () => {
    vi.mocked(getOwnedHaulItem).mockResolvedValue(haulItem);
    const remove = vi.fn().mockRejectedValue(new Error("R2 unavailable"));
    const bucket = { delete: remove } as unknown as R2Bucket;

    await expect(deleteHaulItem(database, bucket, "owner", haulItem.id)).rejects.toThrow(
      "R2 unavailable",
    );
    expect(deleteHaulItemMetadata).not.toHaveBeenCalled();
  });

  it("deletes a wishlist image and its database record", async () => {
    vi.mocked(getOwnedWishlistItem).mockResolvedValue(wishItem);
    vi.mocked(deleteWishlistItemMetadata).mockResolvedValue(true);
    const { bucket, remove } = createBucket();

    await expect(deleteWishlistItem(database, bucket, "owner", wishItem.id)).resolves.toBe(true);
    expect(remove).toHaveBeenCalledWith("img/wishlist/image03.png");
    expect(deleteWishlistItemMetadata).toHaveBeenCalledWith(database, "owner", wishItem.id);
  });

  it("does not touch R2 or D1 when an owned item is not found", async () => {
    vi.mocked(getOwnedHaulItem).mockResolvedValue(null);
    const { bucket, remove } = createBucket();

    await expect(deleteHaulItem(database, bucket, "owner", "missing")).resolves.toBe(false);
    expect(remove).not.toHaveBeenCalled();
    expect(deleteHaulItemMetadata).not.toHaveBeenCalled();
  });
});
