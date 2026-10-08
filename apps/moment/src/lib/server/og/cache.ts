const KV_PREFIX = "moment-og:";
// The image version rolls over daily, so older keys are never read again.
const PNG_TTL = 60 * 60 * 48;

export function getOgImageVersion(date = new Date()): string {
  return encodeURIComponent(date.toISOString().slice(0, 10));
}

export async function readOgImageKv(
  kv: KVNamespace,
  section: string,
  count: number,
  imageVersion: string,
): Promise<ArrayBuffer | null> {
  return kv.get(`${KV_PREFIX}${imageVersion}:${section}:${count}`, "arrayBuffer");
}

export async function writeOgImageKv(
  kv: KVNamespace,
  section: string,
  count: number,
  imageVersion: string,
  image: ArrayBuffer,
): Promise<void> {
  await kv.put(`${KV_PREFIX}${imageVersion}:${section}:${count}`, image, {
    expirationTtl: PNG_TTL,
  });
}
