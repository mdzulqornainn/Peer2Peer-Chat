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
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-primary text-lg font-bold text-on-primary">
            P2P
          </div>
          <h1 className="text-2xl font-semibold text-ink">Peer-to-Peer Chat</h1>
          <p className="mt-2 text-sm text-ink/60">
            WebRTC Data Channel · Enkripsi XOR · Sinyal Differential Manchester
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-soft/70 bg-surface shadow-sm p-6">
          <label className="block">
            <span className="mb-1.5 block text-sm text-ink/80">Username (nama tampilan)</span>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={24}
              placeholder="contoh: Adinda"
              className="w-full rounded-lg border border-soft bg-surface px-3 py-2.5 text-ink outline-none placeholder:text-ink/40 focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full rounded-lg bg-primary py-2.5 font-medium text-on-primary transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            Lanjut
          </button>
          <p className="text-center text-xs text-ink/60">Tanpa akun. Nama hanya disimpan di browser ini.</p>
        </form>
      </div>
    </main>
  );
}
