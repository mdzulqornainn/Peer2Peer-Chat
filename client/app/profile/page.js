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
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-500 text-3xl font-bold text-slate-950">
            {username.charAt(0).toUpperCase()}
          </div>
          <p className="mt-4 text-xs uppercase tracking-wider text-slate-500">Username</p>
          <h1 className="mt-1 text-2xl font-semibold text-white">{username}</h1>
          <p className="mt-3 text-sm text-slate-400">
            Your name is stored only in this browser (localStorage). No server-side account exists.
          </p>

          <button
            onClick={handleLogout}
            className="mt-8 w-full rounded-lg bg-rose-500 py-2.5 font-medium text-white transition hover:bg-rose-400"
          >
            Reset / Logout
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
