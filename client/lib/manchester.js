/**
 * Differential Manchester Encoding
 * --------------------------------
 * Konvensi yang dipakai (IEEE 802.5 / Token Ring style):
 *   - SELALU ada transisi di TENGAH setiap bit (untuk clock recovery).
 *   - Bit 0  -> ADA transisi di AWAL bit.
 *   - Bit 1  -> TIDAK ADA transisi di awal bit.
 *
 * Yang membawa informasi adalah ADA/TIDAKNYA transisi di awal bit,
 * bukan level absolutnya — jadi sinyal tetap bisa di-decode walau
 * polaritas kabel terbalik.
 *
 * Output: array "half-bit" levels (0 = LOW, 1 = HIGH), panjang = bits.length * 2.
 *   halves[2i]   = level paruh pertama bit ke-i
 *   halves[2i+1] = level paruh kedua bit ke-i
 */

/**
 * @param {string} bits - string "0101..."
 * @param {0|1} initialLevel - level garis SEBELUM bit pertama (default LOW)
 * @returns {number[]} half-bit levels
 */
export function differentialManchesterEncode(bits, initialLevel = 0) {
  const halves = new Array(bits.length * 2);
  let level = initialLevel;

  for (let i = 0; i < bits.length; i++) {
    const bit = bits[i];
    if (bit !== '0' && bit !== '1') throw new Error(`Invalid bit "${bit}" at index ${i}`);

    if (bit === '0') level ^= 1; // bit 0: transisi di awal bit
    halves[2 * i] = level; //        paruh pertama
    level ^= 1; //                   transisi wajib di tengah bit
    halves[2 * i + 1] = level; //    paruh kedua
  }
  return halves;
}

/**
 * Decoder (kebalikan) — dipakai untuk verifikasi / unit test.
 * Bit = 0 jika level paruh pertama != level akhir bit sebelumnya.
 */
export function differentialManchesterDecode(halves, initialLevel = 0) {
  let prev = initialLevel;
  let bits = '';
  for (let i = 0; i < halves.length; i += 2) {
    bits += halves[i] !== prev ? '0' : '1';
    prev = halves[i + 1];
  }
  return bits;
}
