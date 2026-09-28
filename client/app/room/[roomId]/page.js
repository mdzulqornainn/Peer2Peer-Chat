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
      <header className="border-b border-slate-800 bg-slate-950/90 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-4xl flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <Link href="/home" className="text-xs text-slate-500 hover:text-slate-300">
                ← Home
              </Link>
              <h1 className="truncate text-lg font-semibold text-white">
                Room <span className="font-mono tracking-widest text-emerald-400">{roomId}</span>
              </h1>
              <p className="text-xs text-slate-400">
                You: <span className="text-slate-200">{username}</span>
                <span className="mx-1.5">·</span>
                Peer:{' '}
                <span className="text-slate-200">{peerName || 'waiting…'}</span>
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                isReady ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {isReady ? 'P2P connected' : 'Not connected'}
            </span>
          </div>
          <ConnectionStatus
            signalingState={signalingState}
            peerState={peerState}
            iceState={iceState}
            channelState={channelState}
          />
          {error && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
              {error}
            </div>
          )}
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto flex max-w-4xl flex-col gap-5">
          {messages.length === 0 && (
            <p className="mt-10 text-center text-sm text-slate-500">
              Share the Room ID <span className="font-mono text-slate-300">{roomId}</span> with a friend to start.
            </p>
          )}
          {messages.map((m) =>
            m.type === 'system' ? (
              <div key={m.id} className="text-center text-[11px] text-slate-500">
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
      <footer className="border-t border-slate-800 bg-slate-950 px-4 py-3">
        <form onSubmit={handleSend} className="mx-auto flex max-w-4xl gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={1000}
            disabled={!isReady}
            placeholder={isReady ? 'Type a message (XOR-encrypted, sent P2P)…' : 'Waiting for P2P connection…'}
            className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-white outline-none placeholder:text-slate-600 focus:border-emerald-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!isReady || !draft.trim()}
            className="rounded-lg bg-emerald-500 px-5 font-medium text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Send
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
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-slate-300">
        <p>Invalid Room ID.</p>
        <Link href="/home" className="text-emerald-400 hover:underline">
          Back to Home
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
