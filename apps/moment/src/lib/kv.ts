import type { KVNamespace } from "@cloudflare/workers-types";

const MANIFEST_KEY = "manifest";

export interface PhotoManifest {
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
  geo?: { lat: number; lng: number };
}

export async function readManifest(kv: KVNamespace): Promise<PhotoManifest[]> {
  const data = await kv.get<PhotoManifest[]>(MANIFEST_KEY, "json");
  return Array.isArray(data) ? data : [];
}

export async function writeManifest(kv: KVNamespace, photos: PhotoManifest[]): Promise<void> {
  await kv.put(MANIFEST_KEY, JSON.stringify(photos));
}

export async function deleteManifest(kv: KVNamespace): Promise<void> {
  await kv.delete(MANIFEST_KEY);
}

export async function appendPhoto(kv: KVNamespace, photo: PhotoManifest): Promise<PhotoManifest[]> {
  const photos = await readManifest(kv);
  photos.push(photo);
  await writeManifest(kv, photos);
  return photos;
}
