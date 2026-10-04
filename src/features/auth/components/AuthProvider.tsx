import { useMemo, useState, type ReactNode } from 'react';

import { queryClient } from '@/api/queryClient';

import { AuthContext, type AuthApi } from '../hooks/authContext';
import {
  clearSession,
  readSession,
  writeSession,
  type Session,
} from '../session';

/**
 * Guarda la sesión en memoria y en localStorage, y provee `useAuth()`. Al entrar y al salir vacía
 * el caché de TanStack Query, para que los datos de una sesión no se vean en la siguiente.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(readSession);

  const api = useMemo<AuthApi>(
    () => ({
      user: session?.user ?? null,
      token: session?.token ?? null,
      signIn: (next) => {
        writeSession(next);
        queryClient.clear();
        setSession(next);
      },
      signOut: () => {
        clearSession();
        queryClient.clear();
        setSession(null);
      },
    }),
    [session],
  );

  return <AuthContext value={api}>{children}</AuthContext>;
}
