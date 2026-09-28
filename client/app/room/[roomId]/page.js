'use client';

// CHAT ROOM — status koneksi WebRTC + chat bubble + waveform
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import ChatBubble from '@/components/ChatBubble';
import ConnectionStatus from '@/components/ConnectionStatus';
import { useUser } from '@/context/UserContext';
import { useWebRTC } from '@/lib/useWebRTC';
import { isValidRoomId, normalizeRoomId } from '@/lib/roomId';

function ChatRoom({ roomId }) {
  const { username } = useUser();
  const {
    signalingState,
    peerState,
    iceState,
    channelState,
    peerName,
    messages,
    error,
    sendMessage,
    isReady,
  } = useWebRTC(roomId, username);

  const [draft, setDraft] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    if (sendMessage(text)) setDraft('');
  };

  return (
    <div className="flex h-[100dvh] flex-col">
      {/* Header */}
      <header className="border-b border-soft/70 bg-surface/90 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-4xl flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <Link href="/home" className="text-xs text-ink/60 hover:text-primary-dark">
                ← Beranda
              </Link>
              <h1 className="truncate text-lg font-semibold text-ink">
                Room <span className="font-mono tracking-widest text-accent">{roomId}</span>
              </h1>
              <p className="text-xs text-ink/60">
                Kamu: <span className="text-ink">{username}</span>
                <span className="mx-1.5">·</span>
                Lawan bicara:{' '}
                <span className="text-ink">{peerName || 'menunggu…'}</span>
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                isReady ? 'bg-primary text-on-primary' : 'bg-canvas text-primary-dark'
              }`}
            >
              {isReady ? 'P2P terhubung' : 'Belum terhubung'}
            </span>
          </div>
          <ConnectionStatus
            signalingState={signalingState}
            peerState={peerState}
            iceState={iceState}
            channelState={channelState}
          />
          {error && (
            <div className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-800">
              {error}
            </div>
          )}
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto flex max-w-4xl flex-col gap-5">
          {messages.length === 0 && (
            <p className="mt-10 text-center text-sm text-ink/60">
              Bagikan Room ID <span className="font-mono text-ink/80">{roomId}</span> ke temanmu untuk mulai chat.
            </p>
          )}
          {messages.map((m) =>
            m.type === 'system' ? (
              <div key={m.id} className="text-center text-[11px] text-ink/60">
                {m.text}
              </div>
            ) : (
              <ChatBubble key={m.id} message={m} />
            )
          )}
          <div ref={bottomRef} />
        </div>
      </main>

      {/* Composer */}
      <footer className="border-t border-soft/70 bg-surface px-4 py-3">
        <form onSubmit={handleSend} className="mx-auto flex max-w-4xl gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={1000}
            disabled={!isReady}
            placeholder={isReady ? 'Ketik pesan (dienkripsi XOR, dikirim P2P)…' : 'Menunggu koneksi P2P…'}
            className="flex-1 rounded-lg border border-soft bg-canvas/40 px-3 py-2.5 text-ink outline-none placeholder:text-ink/40 focus:border-primary disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!isReady || !draft.trim()}
            className="rounded-lg bg-primary px-5 font-medium text-on-primary transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            Kirim
          </button>
        </form>
      </footer>
    </div>
  );
}

export default function RoomPage() {
  const params = useParams();
  let raw = String(params.roomId || '');
  try {
    raw = decodeURIComponent(raw);
  } catch {}
  const roomId = normalizeRoomId(raw);

  if (!isValidRoomId(roomId)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-ink/80">
        <p>Room ID tidak valid.</p>
        <Link href="/home" className="text-accent hover:underline">
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  return (
    <AuthGuard>
      <ChatRoom roomId={roomId} />
    </AuthGuard>
  );
}
