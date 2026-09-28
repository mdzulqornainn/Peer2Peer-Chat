'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@/context/UserContext';

const links = [
  { href: '/home', label: 'Beranda' },
  { href: '/profile', label: 'Profil' },
];

export default function Navbar() {
  const { username } = useUser();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-soft/60 bg-surface/80 backdrop-blur">
      <nav className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link href="/home" className="flex items-center gap-2 font-semibold text-primary-dark">
          <span className="grid h-7 place-items-center rounded-md bg-primary px-1.5 text-xs font-bold text-on-primary">
            P2P
          </span>
          <span className="hidden sm:inline">Chat</span>
        </Link>
        <div className="flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-md px-3 py-1.5 text-sm transition ${
                pathname === l.href
                  ? 'bg-primary text-on-primary'
                  : 'text-ink/70 hover:bg-canvas hover:text-primary-dark'
              }`}
            >
              {l.label}
            </Link>
          ))}
          {username && (
            <span className="ml-2 hidden rounded-full bg-canvas px-3 py-1 text-xs font-medium text-primary-dark sm:inline">
              {username}
            </span>
          )}
        </div>
      </nav>
    </header>
  );
}
