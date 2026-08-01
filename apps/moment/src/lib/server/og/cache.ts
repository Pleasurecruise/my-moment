const KV_PREFIX = "moment-og:";
const PNG_TTL = 60 * 60 * 24 * 30;

export async function readOgImageKv(
  kv: KVNamespace,
  section: string,
  count: number,
): Promise<ArrayBuffer | null> {
  return kv.get(`${KV_PREFIX}${section}:${count}`, "arrayBuffer");
}

export async function writeOgImageKv(
  kv: KVNamespace,
  section: string,
  count: number,
  image: ArrayBuffer,
): Promise<void> {
  await kv.put(`${KV_PREFIX}${section}:${count}`, image, { expirationTtl: PNG_TTL });
}
