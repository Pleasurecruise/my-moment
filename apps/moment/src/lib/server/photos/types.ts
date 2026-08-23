export interface PhotoListInput {
  fromDate?: string;
  toDate?: string;
  tags?: string[];
  limit: number;
}

export interface PhotoSearchInput {
  query: string;
  limit: number;
}

export interface CreatePhotoFromR2Input {
  r2Key: string;
  thumbnailR2Key: string;
  title: string;
  description?: string;
  tags: string[];
  date?: string;
  geo?: { lat: number; lng: number };
  thumbHash?: string;
  width: number;
  height: number;
  aspectRatio?: number;
  format?: string;
}
