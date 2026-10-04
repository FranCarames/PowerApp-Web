import { Navigate } from 'react-router';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { homePathFor } from '@/features/auth/homePath';

/**
 * Ruta "/": lleva al inicio del rol de la sesión (o al cambio de contraseña, si lo tiene pendiente),
 * o al login si no hay sesión.
 */
export function HomeRedirect() {
  const { user, passwordChangeRequired } = useAuth();

  return (
    <Navigate
      to={user ? homePathFor({ user, passwordChangeRequired }) : '/login'}
      replace
    />
  );
}
