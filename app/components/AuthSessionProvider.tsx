'use client';

import { createContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { getBrowserSupabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const supabase = getBrowserSupabase();
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        setUser(session?.user || null);

        if (!session) {
          const publicPaths = ['/signin', '/signup'];
          const isPublicPath = publicPaths.includes(pathname);

          if (!isPublicPath) {
            router.push('/signin');
          }
        }
      } catch (error) {
        console.error('AuthSessionProvider: Error checking session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);

      if (event === 'SIGNED_OUT') {
        router.push('/signin');
      } else if (event === 'SIGNED_IN') {
        router.push('/');
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [supabase, router, pathname]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-stone-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stone-900 mx-auto mb-4"></div>
          <p className="text-stone-600">Loading...</p>
        </div>
      </div>
    );
  }

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      router.push('/signin');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
