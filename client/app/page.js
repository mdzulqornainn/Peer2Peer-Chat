'use client';

// ENTRY PAGE — input Username saja (tanpa database / auth)
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';

export default function EntryPage() {
  const { username, setUsername, hydrated } = useUser();
  const [name, setName] = useState('');
  const router = useRouter();

  // Sudah punya username -> langsung ke Home
  useEffect(() => {
    if (hydrated && username) router.replace('/home');
  }, [hydrated, username, router]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const clean = name.trim();
    if (!clean) return;
    setUsername(clean);
    router.push('/home');
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-emerald-500 text-lg font-bold text-slate-950">
            P2P
          </div>
          <h1 className="text-2xl font-semibold text-white">Peer-to-Peer Chat</h1>
          <p className="mt-2 text-sm text-slate-400">
            WebRTC Data Channel · XOR encryption · Differential Manchester signals
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <label className="block">
            <span className="mb-1.5 block text-sm text-slate-300">Username (display name)</span>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={24}
              placeholder="e.g. Adinda"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none placeholder:text-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
            />
          </label>
          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full rounded-lg bg-emerald-500 py-2.5 font-medium text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Continue
          </button>
          <p className="text-center text-xs text-slate-500">No account needed. Stored only in this browser.</p>
        </form>
      </div>
    </main>
  );
}
