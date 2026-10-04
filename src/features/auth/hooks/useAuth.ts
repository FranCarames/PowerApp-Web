import { useContext } from 'react';

import { AuthContext } from './authContext';

/** La sesión: `user`, `token`, `signIn(session)` y `signOut()`. Requiere <AuthProvider>. */
export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) {
    throw new Error('useAuth tiene que usarse dentro de <AuthProvider>');
  }
  return auth;
}
