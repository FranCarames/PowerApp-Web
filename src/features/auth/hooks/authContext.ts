import { createContext } from 'react';

import type { User } from '@/api/types';

import type { Session } from '../session';

export interface AuthApi {
  /** `null` si no hay sesión. */
  user: User | null;
  token: string | null;
  /** Entró con una contraseña temporal y todavía no la cambió: solo puede ir a /cambiar-contrasena. */
  passwordChangeRequired: boolean;
  signIn: (session: Session) => void;
  signOut: () => void;
  /** Termina el cambio obligatorio de contraseña: libera el guard, sin cerrar la sesión. */
  completePasswordChange: () => void;
}

export const AuthContext = createContext<AuthApi | null>(null);
