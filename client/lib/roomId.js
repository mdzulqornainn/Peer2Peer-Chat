// Tanpa huruf/angka yang mirip (0/O, 1/I/L) supaya gampang dibacakan
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const ROOM_ID_PATTERN = /^[A-Z0-9-]{4,32}$/;

/** Random Room ID, contoh: "K7QX-M2PA". Pakai crypto.getRandomValues (jalan juga di http LAN). */
export function generateRoomId(length = 8) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let id = '';
  for (let i = 0; i < length; i++) {
    id += ALPHABET[bytes[i] % ALPHABET.length];
    if (i === 3 && length === 8) id += '-';
  }
  return id;
}

export function normalizeRoomId(raw) {
  return String(raw || '').trim().toUpperCase().replace(/\s+/g, '');
}

export function isValidRoomId(id) {
  return ROOM_ID_PATTERN.test(id);
}
