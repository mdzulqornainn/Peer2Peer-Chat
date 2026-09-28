'use client';

// HOME DASHBOARD — greeting, Buat Room ID Acak, Join Existing Room
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import Navbar from '@/components/Navbar';
import { useUser } from '@/context/UserContext';
import { generateRoomId, isValidRoomId, normalizeRoomId } from '@/lib/roomId';

function greeting() {
  const h = new Date().getHours();
  if (h < 11) return 'Selamat pagi';
  if (h < 15) return 'Selamat siang';
  if (h < 18) return 'Selamat sore';
  return 'Selamat malam';
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
      setJoinError('Room ID harus 4–32 karakter: A–Z, 0–9, atau "-".');
      return;
    }
    setJoinError('');
    goToRoom(id);
  };

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-3xl font-semibold text-ink">
          {greeting()}, <span className="text-accent">{username}</span> 👋
        </h1>
        <p className="mt-2 text-ink/60">
          Buat room baru lalu bagikan ID-nya, atau masuk ke room yang dibagikan temanmu. Satu room maksimal 2 orang.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {/* Generate */}
          <section className="rounded-2xl border border-soft/70 bg-surface shadow-sm p-6">
            <h2 className="font-semibold text-primary-dark">Buat room baru</h2>
            <p className="mt-1 text-sm text-ink/60">Room ID juga dipakai sebagai key enkripsi XOR.</p>

            <button
              onClick={handleGenerate}
              className="mt-4 w-full rounded-lg bg-primary py-2.5 font-medium text-on-primary transition hover:bg-primary-dark"
            >
              Buat Room ID Acak
            </button>

            {generated && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2 rounded-lg border border-soft bg-surface px-3 py-2">
                  <code className="flex-1 font-mono text-lg tracking-widest text-accent">{generated}</code>
                  <button
                    onClick={handleCopy}
                    className="rounded-md px-2 py-1 text-xs text-ink/80 hover:bg-canvas"
                  >
                    {copied ? 'Tersalin ✓' : 'Salin'}
                  </button>
                </div>
                <button
                  onClick={() => goToRoom(generated)}
                  className="w-full rounded-lg border border-primary/50 py-2.5 font-medium text-accent transition hover:bg-primary/10"
                >
                  Masuk ke room ini →
                </button>
              </div>
            )}
          </section>

          {/* Join */}
          <section className="rounded-2xl border border-soft/70 bg-surface shadow-sm p-6">
            <h2 className="font-semibold text-primary-dark">Gabung ke room</h2>
            <p className="mt-1 text-sm text-ink/60">Tempel Room ID yang dikirim temanmu.</p>
            <form onSubmit={handleJoin} className="mt-4 space-y-3">
              <input
                value={joinId}
                onChange={(e) => setJoinId(e.target.value.toUpperCase())}
                placeholder="contoh: K7QX-M2PA"
                maxLength={32}
                className="w-full rounded-lg border border-soft bg-surface px-3 py-2.5 font-mono tracking-widest text-ink outline-none placeholder:text-ink/40 focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              {joinError && <p className="text-xs text-rose-700">{joinError}</p>}
              <button
                type="submit"
                disabled={!joinId.trim()}
                className="w-full rounded-lg bg-accent py-2.5 font-medium text-on-primary transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
              >
                Gabung
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
