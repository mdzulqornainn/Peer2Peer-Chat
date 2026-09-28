'use client';

// PROFILE PAGE — tampilkan username + Reset/Logout
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import Navbar from '@/components/Navbar';
import { useUser } from '@/context/UserContext';

function Profile() {
  const { username, logout } = useUser();
  const router = useRouter();

  const handleLogout = () => {
    logout(); // hapus Context + localStorage
    router.replace('/');
  };

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-md px-4 py-12">
        <div className="rounded-2xl border border-soft/70 bg-surface shadow-sm p-8 text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-primary text-3xl font-bold text-on-primary">
            {username.charAt(0).toUpperCase()}
          </div>
          <p className="mt-4 text-xs uppercase tracking-wider text-ink/60">Username</p>
          <h1 className="mt-1 text-2xl font-semibold text-ink">{username}</h1>
          <p className="mt-3 text-sm text-ink/60">
            Nama kamu hanya disimpan di browser ini (localStorage). Tidak ada akun yang tersimpan di server.
          </p>

          <button
            onClick={handleLogout}
            className="mt-8 w-full rounded-lg bg-rose-600 py-2.5 font-medium text-white transition hover:bg-rose-700"
          >
            Reset / Keluar
          </button>
        </div>
      </main>
    </>
  );
}

export default function ProfilePage() {
  return (
    <AuthGuard>
      <Profile />
    </AuthGuard>
  );
}
