'use client';

// HOME DASHBOARD — greeting, Generate Random Room ID, Join Existing Room
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import Navbar from '@/components/Navbar';
import { useUser } from '@/context/UserContext';
import { generateRoomId, isValidRoomId, normalizeRoomId } from '@/lib/roomId';

function greeting() {
  const h = new Date().getHours();
  if (h < 11) return 'Good morning';
  if (h < 15) return 'Good afternoon';
  if (h < 19) return 'Good evening';
  return 'Good night';
}

function HomeDashboard() {
  const { username } = useUser();
  const router = useRouter();
  const [generated, setGenerated] = useState('');
  const [copied, setCopied] = useState(false);
  const [joinId, setJoinId] = useState('');
  const [joinError, setJoinError] = useState('');

  const handleGenerate = () => {
    setGenerated(generateRoomId());
    setCopied(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generated);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API butuh HTTPS/localhost — user bisa copy manual
    }
  };

  const goToRoom = (id) => router.push(`/room/${encodeURIComponent(id)}`);

  const handleJoin = (e) => {
    e.preventDefault();
    const id = normalizeRoomId(joinId);
    if (!isValidRoomId(id)) {
      setJoinError('Room ID must be 4–32 characters: A–Z, 0–9, or "-".');
      return;
    }
    setJoinError('');
    goToRoom(id);
  };

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-3xl font-semibold text-white">
          {greeting()}, <span className="text-emerald-400">{username}</span> 👋
        </h1>
        <p className="mt-2 text-slate-400">
          Create a new room and share its ID, or join a room someone shared with you. Each room holds 2 peers.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {/* Generate */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="font-medium text-white">Create a room</h2>
            <p className="mt-1 text-sm text-slate-400">The Room ID is also the XOR encryption key.</p>

            <button
              onClick={handleGenerate}
              className="mt-4 w-full rounded-lg bg-emerald-500 py-2.5 font-medium text-slate-950 transition hover:bg-emerald-400"
            >
              Generate Random Room ID
            </button>

            {generated && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2">
                  <code className="flex-1 font-mono text-lg tracking-widest text-emerald-300">{generated}</code>
                  <button
                    onClick={handleCopy}
                    className="rounded-md px-2 py-1 text-xs text-slate-300 hover:bg-slate-800"
                  >
                    {copied ? 'Copied ✓' : 'Copy'}
                  </button>
                </div>
                <button
                  onClick={() => goToRoom(generated)}
                  className="w-full rounded-lg border border-emerald-500/50 py-2.5 font-medium text-emerald-300 transition hover:bg-emerald-500/10"
                >
                  Enter this room →
                </button>
              </div>
            )}
          </section>

          {/* Join */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="font-medium text-white">Join existing room</h2>
            <p className="mt-1 text-sm text-slate-400">Paste the Room ID your peer sent you.</p>
            <form onSubmit={handleJoin} className="mt-4 space-y-3">
              <input
                value={joinId}
                onChange={(e) => setJoinId(e.target.value.toUpperCase())}
                placeholder="e.g. K7QX-M2PA"
                maxLength={32}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 font-mono tracking-widest text-white outline-none placeholder:text-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
              />
              {joinError && <p className="text-xs text-rose-400">{joinError}</p>}
              <button
                type="submit"
                disabled={!joinId.trim()}
                className="w-full rounded-lg bg-slate-100 py-2.5 font-medium text-slate-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Join Room
              </button>
            </form>
          </section>
        </div>
      </main>
    </>
  );
}

export default function HomePage() {
  return (
    <AuthGuard>
      <HomeDashboard />
    </AuthGuard>
  );
}
