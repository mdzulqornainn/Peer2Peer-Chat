'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@/context/UserContext';

const links = [
  { href: '/home', label: 'Home' },
  { href: '/profile', label: 'Profile' },
];

export default function Navbar() {
  const { username } = useUser();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <nav className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link href="/home" className="flex items-center gap-2 font-semibold text-slate-100">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-emerald-500 text-sm font-bold text-slate-950">
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
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              {l.label}
            </Link>
          ))}
          {username && (
            <span className="ml-2 hidden rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300 sm:inline">
              {username}
            </span>
          )}
        </div>
      </nav>
    </header>
  );
}
