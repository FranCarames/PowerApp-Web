import { useMemo, useState, type ReactNode } from 'react';

import { AuthContext, type AuthApi } from '../hooks/authContext';
import {
  clearSession,
  readSession,
  writeSession,
  type Session,
} from '../session';

/** Guarda la sesión en memoria y en localStorage, y provee `useAuth()`. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(readSession);

  const api = useMemo<AuthApi>(
    () => ({
      user: session?.user ?? null,
      token: session?.token ?? null,
      signIn: (next) => {
        writeSession(next);
        setSession(next);
      },
      signOut: () => {
        clearSession();
        setSession(null);
      },
    }),
    [session],
  );

  return <AuthContext value={api}>{children}</AuthContext>;
}
