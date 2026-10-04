import { Navigate } from 'react-router';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { HOME_BY_ROLE } from '@/features/auth/roles';

/** Ruta "/": lleva al inicio del rol de la sesión, o al login si no hay. */
export function HomeRedirect() {
  const { user } = useAuth();

  return <Navigate to={user ? HOME_BY_ROLE[user.role] : '/login'} replace />;
}
