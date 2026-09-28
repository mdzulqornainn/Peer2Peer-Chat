'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'p2pchat.username';
const UserContext = createContext(null);

/**
 * Global state username (tanpa database / auth).
 * Disimpan di React Context + localStorage agar tetap ada setelah refresh.
 */
export function UserProvider({ children }) {
  const [username, setUsernameState] = useState(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setUsernameState(saved);
    } catch {
      // localStorage bisa diblokir (private mode) — tetap jalan pakai state saja
    }
    setHydrated(true);
  }, []);

  const setUsername = useCallback((name) => {
    const clean = String(name || '').trim().slice(0, 24);
    setUsernameState(clean || null);
    try {
      if (clean) localStorage.setItem(STORAGE_KEY, clean);
    } catch {}
  }, []);

  const logout = useCallback(() => {
    setUsernameState(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.clear();
    } catch {}
  }, []);

  const value = useMemo(
    () => ({ username, setUsername, logout, hydrated }),
    [username, setUsername, logout, hydrated]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used inside <UserProvider>');
  return ctx;
}
