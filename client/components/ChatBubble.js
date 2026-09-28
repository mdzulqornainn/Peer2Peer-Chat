'use client';

import { useMemo, useState } from 'react';
import ManchesterWaveform from './ManchesterWaveform';
import { bytesToBinary, bytesToHex } from '@/lib/xor';

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

export default function ChatBubble({ message }) {
  const [showDetails, setShowDetails] = useState(false);
  const isOut = message.direction === 'out';

  const { binary, hex } = useMemo(
    () => ({
      binary: bytesToBinary(message.cipherBytes),
      hex: bytesToHex(message.cipherBytes),
    }),
    [message.cipherBytes]
  );

  return (
    <div className={`flex w-full flex-col ${isOut ? 'items-end' : 'items-start'}`}>
      <div className={`w-full max-w-[92%] sm:max-w-[80%] ${isOut ? 'text-right' : 'text-left'}`}>
        <div className="mb-1 px-1 text-xs text-ink/60">
          <span className="font-semibold text-primary-dark">{isOut ? `${message.sender} (kamu)` : message.sender}</span>
          <span className="mx-1">·</span>
          {formatTime(message.ts)}
        </div>

        <div
          className={`inline-block whitespace-pre-wrap break-words rounded-2xl px-4 py-2 text-left text-sm shadow-sm ${
            isOut
              ? 'rounded-br-sm bg-primary text-on-primary'
              : 'rounded-bl-sm border border-soft bg-surface text-ink'
          }`}
        >
          {message.plaintext}
        </div>

        {/* Visualisasi sinyal langsung di bawah bubble */}
        <div className="text-left">
          <ManchesterWaveform bits={binary} variant={isOut ? 'out' : 'in'} />

          <button
            type="button"
            onClick={() => setShowDetails((v) => !v)}
            className="mt-1 px-1 text-[11px] text-accent hover:text-primary-dark"
          >
            {showDetails ? '▾ Sembunyikan ciphertext' : '▸ Lihat ciphertext (hex / biner)'}
          </button>
          {showDetails && (
            <div className="mt-1 space-y-1 rounded-lg border border-soft bg-surface p-2 font-mono text-[11px] text-ink/80">
              <div>
                <span className="font-semibold text-accent">HEX: </span>
                <span className="break-all">{hex}</span>
              </div>
              <div>
                <span className="font-semibold text-accent">BIN: </span>
                <span className="break-all">{binary.replace(/(.{8})/g, '$1 ').trim()}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
