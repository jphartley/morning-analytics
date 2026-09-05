'use client';

import { createContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { getBrowserSupabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
import { parseApplicationRole, type ApplicationRole } from '@/lib/role-capabilities';

export interface AuthContextType {
  user: User | null;
  role: ApplicationRole;
  profileError: string | null;
  loading: boolean;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

function isInvalidRefreshTokenError(error: unknown): boolean {
  if (!error || typeof error !== 'object' || !('message' in error)) {
    return false;
  }

  return /invalid refresh token|refresh token not found/i.test(String(error.message));
}

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const supabase = getBrowserSupabase();
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<ApplicationRole>('user');
  const [profileError, setProfileError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const publicPaths = ['/signin', '/signup'];
    const isPublicPath = publicPaths.includes(pathname);
    let isActive = true;

    const loadProfile = async (userId: string) => {
      const { data: profile, error: profileLookupError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle();

      if (!isActive) {
        return;
      }

      if (profileLookupError || !profile) {
        setRole('user');
        setProfileError('Your account settings could not be loaded. Experimental controls are unavailable; refresh to try again.');
      } else {
        setRole(parseApplicationRole(profile.role));
        setProfileError(null);
      }
    };

    const scheduleProfileLoad = (userId: string) => {
      // Supabase holds an internal lock while invoking onAuthStateChange. A
      // database request made from that callback can deadlock the client, so
      // defer this work until after the callback has returned.
      window.setTimeout(() => {
        void loadProfile(userId).catch((error) => {
          if (!isActive) {
            return;
          }

          console.error('AuthSessionProvider: Error loading profile:', error);
          setRole('user');
          setProfileError('Your account settings could not be loaded. Experimental controls are unavailable; refresh to try again.');
        });
      }, 0);
    };

    const clearInvalidSession = async () => {
      await supabase.auth.signOut({ scope: 'local' });
      setUser(null);
      setRole('user');
      setProfileError(null);

      if (!isPublicPath) {
        router.push('/signin');
      }
    };

    const checkSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          if (isInvalidRefreshTokenError(error)) {
            await clearInvalidSession();
            return;
          }

          console.error('AuthSessionProvider: Error checking session:', error);
          setUser(null);

          if (!isPublicPath) {
            router.push('/signin');
          }

          return;
        }

        const sessionUser = session?.user || null;
        setUser(sessionUser);

        if (!session) {
          setRole('user');
          setProfileError(null);
          if (!isPublicPath) {
            router.push('/signin');
          }
        } else {
          await loadProfile(session.user.id);
        }
      } catch (error) {
        if (isInvalidRefreshTokenError(error)) {
          await clearInvalidSession();
          return;
        }

        console.error('AuthSessionProvider: Error checking session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const sessionUser = session?.user || null;
      setUser(sessionUser);

      if (event === 'SIGNED_OUT') {
        setRole('user');
        setProfileError(null);
        router.push('/signin');
      } else if (event === 'SIGNED_IN') {
        setRole('user');
        setProfileError(null);
        scheduleProfileLoad(sessionUser!.id);
        router.push('/');
      }
    });

    return () => {
      isActive = false;
      subscription?.unsubscribe();
    };
  }, [supabase, router, pathname]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-page">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ink mx-auto mb-4"></div>
          <p className="text-ink-muted">Loading...</p>
        </div>
      </div>
    );
  }

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setRole('user');
      setProfileError(null);
      router.push('/signin');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, profileError, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
