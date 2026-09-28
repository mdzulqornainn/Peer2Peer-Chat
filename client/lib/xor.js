/**
 * XOR Cipher (symmetric) — key = Room ID
 * ---------------------------------------
 * plaintext (string) --UTF-8--> bytes --XOR key (repeating)--> ciphertext bytes
 * ciphertext bytes  --XOR key (repeating)--> bytes --UTF-8--> plaintext
 *
 * Kerja di level BYTE (bukan charCode) supaya emoji / huruf non-ASCII
 * (é, ş, ğ, 한글, dll) tetap aman bolak-balik.
 *
 * ⚠️ Ini untuk tujuan edukasi. XOR dengan key pendek yang berulang BUKAN
 *    enkripsi yang aman (rentan known-plaintext & frequency analysis).
 */

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/** XOR setiap byte data dengan byte key secara berulang (key[i % key.length]). */
export function xorBytes(data, key) {
  const keyBytes = encoder.encode(key);
  if (keyBytes.length === 0) throw new Error('XOR key (Room ID) must not be empty');

  const out = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    out[i] = data[i] ^ keyBytes[i % keyBytes.length];
  }
  return out;
}

/** Encrypt plaintext string -> ciphertext Uint8Array */
export function xorEncrypt(plaintext, key) {
  return xorBytes(encoder.encode(plaintext), key);
}

/** Decrypt ciphertext Uint8Array -> plaintext string */
export function xorDecrypt(cipherBytes, key) {
  return decoder.decode(xorBytes(cipherBytes, key));
}

// ---------- Helpers: transport & representasi ----------

/** Uint8Array -> Base64 (untuk dikirim lewat DataChannel dalam JSON) */
export function bytesToBase64(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

/** Base64 -> Uint8Array */
export function base64ToBytes(b64) {
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

/** Uint8Array -> "0100100001101001..." (8 bit per byte, MSB first) */
export function bytesToBinary(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += bytes[i].toString(2).padStart(8, '0');
  return s;
}

/** Uint8Array -> "48 69 ..." */
export function bytesToHex(bytes) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
}
