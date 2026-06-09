export interface PhotoItem {
  id: string;
  url: string;
  thumbnailUrl: string;
  thumbHash?: string;
  title: string;
  width: number;
  height: number;
  aspectRatio?: number;
  tags: string[];
  date?: string;
  description?: string;
  size?: number;
  format?: string;
}
