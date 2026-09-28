'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';

/** Redirect ke Entry Page kalau belum ada username. */
export default function AuthGuard({ children }) {
  const { username, hydrated } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && !username) router.replace('/');
  }, [hydrated, username, router]);

  if (!hydrated || !username) {
    return <div className="flex min-h-screen items-center justify-center text-ink/60">Memuat…</div>;
  }
  return children;
}
