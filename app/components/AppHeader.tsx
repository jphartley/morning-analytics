'use client';

import { useAuth } from '@/lib/useAuth';
import Link from 'next/link';

export function AppHeader() {
  const { user, logout } = useAuth();

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="border-b border-outline bg-surface">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="text-lg font-semibold text-ink">
          Morning Analytics
        </Link>

        <div className="flex items-center gap-4">
          <span className="text-sm text-ink-muted">{user.email}</span>
          <button
            onClick={handleLogout}
            className="text-sm px-3 py-1 bg-page hover:opacity-80 text-ink rounded transition"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}
