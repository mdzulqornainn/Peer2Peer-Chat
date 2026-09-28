'use client';

import { useMemo, useState } from 'react';
import { differentialManchesterEncode } from '@/lib/manchester';

/**
 * SVG visualizer untuk Differential Manchester.
 *
 * Props:
 *  - bits: string "0101..." (binary dari CIPHERTEXT)
 *  - variant: 'out' (pesan terkirim) | 'in' (pesan diterima) — menentukan warna garis
 *  - maxBytes: berapa byte yang ditampilkan sebelum tombol "Show all"
 *
 * Panel berlatar ungu gelap (--color-primary-dark) ala osiloskop,
 * garis sinyal pakai --color-canvas (out) / --color-soft (in).
 * Warna diambil dari CSS variable di app/globals.css.
 */
const BIT_W = 28;
const HALF_W = BIT_W / 2;
const PAD_X = 36;
const TOP = 22; // ruang label bit
const HIGH_Y = TOP + 6;
const LOW_Y = TOP + 46;
const HEIGHT = LOW_Y + 18;

const c = (name, alpha = 1) => `rgb(var(--color-${name}) / ${alpha})`;

export default function ManchesterWaveform({ bits, variant = 'out', maxBytes = 8 }) {
  const [showAll, setShowAll] = useState(false);
  const signalColor = variant === 'out' ? c('canvas') : c('soft');

  const totalBytes = Math.ceil(bits.length / 8);
  const truncated = !showAll && totalBytes > maxBytes;
  const shownBits = truncated ? bits.slice(0, maxBytes * 8) : bits;

  const { path, halves } = useMemo(() => {
    const h = differentialManchesterEncode(shownBits, 0);
    const y = (lvl) => (lvl ? HIGH_Y : LOW_Y);

    // Mulai dari level awal (LOW) sedikit sebelum bit pertama
    let prev = 0;
    let d = `M ${PAD_X - 10} ${y(prev)} L ${PAD_X} ${y(prev)}`;
    for (let i = 0; i < h.length; i++) {
      const x = PAD_X + i * HALF_W;
      if (h[i] !== prev) d += ` L ${x} ${y(h[i])}`; // transisi vertikal
      d += ` L ${x + HALF_W} ${y(h[i])}`; //           level horizontal
      prev = h[i];
    }
    return { path: d, halves: h };
  }, [shownBits]);

  const width = PAD_X + shownBits.length * BIT_W + 12;

  return (
    <div className="mt-2 rounded-lg bg-primary-dark p-2 shadow-sm">
      <div className="mb-1 flex items-center justify-between gap-2 text-[10px] uppercase tracking-wider text-canvas/70">
        <span>Differential Manchester · ciphertext ({bits.length} bit)</span>
        {totalBytes > maxBytes && (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="rounded px-1.5 py-0.5 normal-case tracking-normal text-canvas hover:bg-white/10"
          >
            {showAll ? `Tampilkan ${maxBytes} byte pertama` : `Tampilkan semua ${totalBytes} byte`}
          </button>
        )}
      </div>

      <div className="waveform-scroll overflow-x-auto">
        <svg
          width={width}
          height={HEIGHT}
          viewBox={`0 0 ${width} ${HEIGHT}`}
          role="img"
          aria-label={`Gelombang Differential Manchester, ${shownBits.length} bit`}
          className="block"
        >
          {/* Level labels */}
          <text x={4} y={HIGH_Y + 4} style={{ fill: c('canvas', 0.6) }} fontSize="10" fontFamily="monospace">H</text>
          <text x={4} y={LOW_Y + 4} style={{ fill: c('canvas', 0.6) }} fontSize="10" fontFamily="monospace">L</text>
          <line x1={PAD_X - 10} x2={width} y1={HIGH_Y} y2={HIGH_Y} style={{ stroke: c('canvas', 0.15) }} strokeDasharray="2 4" />
          <line x1={PAD_X - 10} x2={width} y1={LOW_Y} y2={LOW_Y} style={{ stroke: c('canvas', 0.15) }} strokeDasharray="2 4" />

          {Array.from(shownBits).map((bit, i) => {
            const x = PAD_X + i * BIT_W;
            const isByteStart = i % 8 === 0;
            return (
              <g key={i}>
                {/* Batas bit / byte */}
                <line
                  x1={x}
                  x2={x}
                  y1={TOP - 4}
                  y2={LOW_Y + 6}
                  style={{ stroke: c('soft', isByteStart ? 0.6 : 0.2) }}
                  strokeWidth={isByteStart ? 1.5 : 1}
                  strokeDasharray={isByteStart ? undefined : '3 3'}
                />
                {/* Tick clock di tengah bit */}
                <line x1={x + HALF_W} x2={x + HALF_W} y1={LOW_Y + 8} y2={LOW_Y + 12} style={{ stroke: c('soft', 0.4) }} />
                {/* Label bit */}
                <text
                  x={x + HALF_W}
                  y={TOP - 8}
                  textAnchor="middle"
                  fontSize="11"
                  fontFamily="monospace"
                  style={{ fill: bit === '1' ? c('canvas') : c('canvas', 0.5) }}
                >
                  {bit}
                </text>
              </g>
            );
          })}
          {/* Garis penutup bit terakhir */}
          <line
            x1={PAD_X + shownBits.length * BIT_W}
            x2={PAD_X + shownBits.length * BIT_W}
            y1={TOP - 4}
            y2={LOW_Y + 6}
            style={{ stroke: c('soft', 0.6) }}
            strokeWidth={1.5}
          />

          {/* Sinyal */}
          <path d={path} fill="none" style={{ stroke: signalColor }} strokeWidth="2" strokeLinejoin="miter" />
        </svg>
      </div>

      <div className="mt-1 flex flex-wrap gap-x-3 text-[10px] text-canvas/60">
        <span>bit 0 = ada transisi di awal bit</span>
        <span>bit 1 = tanpa transisi di awal bit</span>
        <span>selalu ada transisi di tengah bit</span>
        {truncated && <span className="text-soft">menampilkan {halves.length / 2} dari {bits.length} bit</span>}
      </div>
    </div>
  );
}
