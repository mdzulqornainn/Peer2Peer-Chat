'use client';

import { useMemo, useState } from 'react';
import { differentialManchesterEncode } from '@/lib/manchester';

/**
 * SVG visualizer untuk Differential Manchester.
 *
 * Props:
 *  - bits: string "0101..." (binary dari CIPHERTEXT)
 *  - color: warna garis sinyal
 *  - maxBytes: berapa byte yang ditampilkan sebelum tombol "Show all"
 *
 * Layout per bit (lebar BIT_W):
 *   |<-- half 1 -->|<-- half 2 -->|
 *   garis putus-putus = batas bit, garis tebal = batas byte
 *   label bit ditulis di atas, garis tengah bit (clock) samar di bawah.
 */
const BIT_W = 28;
const HALF_W = BIT_W / 2;
const PAD_X = 36;
const TOP = 22; // ruang label bit
const HIGH_Y = TOP + 6;
const LOW_Y = TOP + 46;
const HEIGHT = LOW_Y + 18;

export default function ManchesterWaveform({ bits, color = '#34d399', maxBytes = 8 }) {
  const [showAll, setShowAll] = useState(false);

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
    <div className="mt-2 rounded-lg border border-slate-800 bg-slate-950/70 p-2">
      <div className="mb-1 flex items-center justify-between gap-2 text-[10px] uppercase tracking-wider text-slate-500">
        <span>Differential Manchester · ciphertext ({bits.length} bits)</span>
        {totalBytes > maxBytes && (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="rounded px-1.5 py-0.5 normal-case tracking-normal text-slate-300 hover:bg-slate-800"
          >
            {showAll ? `Show first ${maxBytes} bytes` : `Show all ${totalBytes} bytes`}
          </button>
        )}
      </div>

      <div className="waveform-scroll overflow-x-auto">
        <svg
          width={width}
          height={HEIGHT}
          viewBox={`0 0 ${width} ${HEIGHT}`}
          role="img"
          aria-label={`Differential Manchester waveform of ${shownBits.length} bits`}
          className="block"
        >
          {/* Level labels */}
          <text x={4} y={HIGH_Y + 4} className="fill-slate-500" fontSize="10" fontFamily="monospace">H</text>
          <text x={4} y={LOW_Y + 4} className="fill-slate-500" fontSize="10" fontFamily="monospace">L</text>
          <line x1={PAD_X - 10} x2={width} y1={HIGH_Y} y2={HIGH_Y} stroke="#1e293b" strokeDasharray="2 4" />
          <line x1={PAD_X - 10} x2={width} y1={LOW_Y} y2={LOW_Y} stroke="#1e293b" strokeDasharray="2 4" />

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
                  stroke={isByteStart ? '#475569' : '#1e293b'}
                  strokeWidth={isByteStart ? 1.5 : 1}
                  strokeDasharray={isByteStart ? undefined : '3 3'}
                />
                {/* Tick clock di tengah bit */}
                <line x1={x + HALF_W} x2={x + HALF_W} y1={LOW_Y + 8} y2={LOW_Y + 12} stroke="#334155" />
                {/* Label bit */}
                <text
                  x={x + HALF_W}
                  y={TOP - 8}
                  textAnchor="middle"
                  fontSize="11"
                  fontFamily="monospace"
                  fill={bit === '1' ? '#e2e8f0' : '#64748b'}
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
            stroke="#475569"
            strokeWidth={1.5}
          />

          {/* Sinyal */}
          <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="miter" />
        </svg>
      </div>

      <div className="mt-1 flex flex-wrap gap-x-3 text-[10px] text-slate-500">
        <span>bit 0 = transition at start</span>
        <span>bit 1 = no transition at start</span>
        <span>always a transition mid-bit</span>
        {truncated && <span className="text-amber-400/80">showing {halves.length / 2} of {bits.length} bits</span>}
      </div>
    </div>
  );
}
