export function decompressUint8Array(compressed: string): Uint8Array {
  return Uint8Array.from(compressed.match(/.{1,2}/g)!.map((byte) => Number.parseInt(byte, 16)));
}
