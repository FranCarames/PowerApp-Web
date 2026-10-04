import { createContext } from 'react';

import type { User } from '@/api/types';

import type { Session } from '../session';

export interface AuthApi {
  /** `null` si no hay sesión. */
  user: User | null;
  token: string | null;
  signIn: (session: Session) => void;
  signOut: () => void;
}

export const AuthContext = createContext<AuthApi | null>(null);
