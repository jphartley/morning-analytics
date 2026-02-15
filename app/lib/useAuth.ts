import { useContext } from 'react';
import { AuthContext } from '@/components/AuthSessionProvider';

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthSessionProvider');
  }
  return context;
}
