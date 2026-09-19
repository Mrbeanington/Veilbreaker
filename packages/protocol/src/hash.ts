// SHA-256 through the Web Crypto API (available in every current browser, in
// Web Workers, and in Node 20+), plus a canonical JSON form so two machines
// hash byte-identical text for the same data (spec/06 "Verification").

/** JSON with object keys sorted, so equal data always serializes identically. */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      const v = (value as Record<string, unknown>)[key];
      if (v !== undefined) out[key] = sortKeys(v);
    }
    return out;
  }
  return value;
}

const encoder = new TextEncoder();

export async function sha256Hex(input: string | Uint8Array): Promise<string> {
  const bytes = typeof input === "string" ? encoder.encode(input) : input;
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes as BufferSource);
  return toHex(new Uint8Array(digest));
}

export function toHex(bytes: Uint8Array): string {
  let out = "";
  for (const b of bytes) out += b.toString(16).padStart(2, "0");
  return out;
}

/** Source of secret random bytes. Injected so tests can be deterministic; the default is the browser's CSPRNG. */
export type RandomBytes = (length: number) => Uint8Array;

export const cryptoRandomBytes: RandomBytes = (length) => globalThis.crypto.getRandomValues(new Uint8Array(length));

export const randomHex = (source: RandomBytes, length = 32): string => toHex(source(length));

export const HEX_64 = /^[0-9a-f]{64}$/;
