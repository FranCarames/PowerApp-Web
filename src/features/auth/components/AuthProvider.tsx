import {
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

import { useToast } from '@/shared/ui';

import { AuthContext, type AuthApi } from '../hooks/authContext';
import {
  completePasswordChange,
  endSession,
  getSession,
  onSessionEnded,
  startSession,
  subscribeSession,
} from '../sessionStore';

/**
 * Provee `useAuth()`. La sesión vive en `sessionStore`, que la guarda en memoria y en localStorage y
 * vacía el caché de TanStack Query al entrar y al salir. Acá se muestra el aviso cuando el cliente
 * la cierra solo (sesión vencida, cuenta deshabilitada).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const session = useSyncExternalStore(subscribeSession, getSession);
  const toast = useToast();

  useEffect(() => onSessionEnded((notice) => toast.error(notice)), [toast]);

  const api = useMemo<AuthApi>(
    () => ({
      user: session?.user ?? null,
      token: session?.token ?? null,
      passwordChangeRequired: session?.passwordChangeRequired === true,
      signIn: startSession,
      // Sin argumentos: así un onClick no le pasa el evento como aviso.
      signOut: () => endSession(),
      completePasswordChange,
    }),
    [session],
  );

  return <AuthContext value={api}>{children}</AuthContext>;
}
