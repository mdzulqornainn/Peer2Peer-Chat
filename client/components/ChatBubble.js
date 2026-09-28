'use client';

import { useMemo, useState } from 'react';
import ManchesterWaveform from './ManchesterWaveform';
import { bytesToBinary, bytesToHex } from '@/lib/xor';

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
        <div className="mb-1 px-1 text-xs text-slate-400">
          <span className="font-medium text-slate-300">{isOut ? `${message.sender} (you)` : message.sender}</span>
          <span className="mx-1">·</span>
          {formatTime(message.ts)}
        </div>

        <div
          className={`inline-block whitespace-pre-wrap break-words rounded-2xl px-4 py-2 text-left text-sm shadow ${
            isOut
              ? 'rounded-br-sm bg-emerald-600 text-white'
              : 'rounded-bl-sm bg-slate-800 text-slate-100'
          }`}
        >
          {message.plaintext}
        </div>

        {/* Visualisasi sinyal langsung di bawah bubble */}
        <div className="text-left">
          <ManchesterWaveform bits={binary} color={isOut ? '#34d399' : '#60a5fa'} />

          <button
            type="button"
            onClick={() => setShowDetails((v) => !v)}
            className="mt-1 px-1 text-[11px] text-slate-500 hover:text-slate-300"
          >
            {showDetails ? '▾ Hide ciphertext' : '▸ Show ciphertext (hex / binary)'}
          </button>
          {showDetails && (
            <div className="mt-1 space-y-1 rounded-lg border border-slate-800 bg-slate-950/70 p-2 font-mono text-[11px] text-slate-400">
              <div>
                <span className="text-slate-500">HEX: </span>
                <span className="break-all">{hex}</span>
              </div>
              <div>
                <span className="text-slate-500">BIN: </span>
                <span className="break-all">{binary.replace(/(.{8})/g, '$1 ').trim()}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
