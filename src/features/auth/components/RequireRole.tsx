import { Navigate, Outlet } from 'react-router';

import type { Role } from '@/api/types';

import { useAuth } from '../hooks/useAuth';
import { PASSWORD_CHANGE_PATH } from '../homePath';
import { HOME_BY_ROLE } from '../roles';

/**
 * Guard de ruta. Sin sesión lleva a /login. Con un cambio de contraseña pendiente, a
 * /cambiar-contrasena (la única pantalla permitida). Con `role`, quien tiene otro rol vuelve a su
 * inicio. Sin `role` alcanza con estar logueado (Mi cuenta es de los tres roles).
 */
export function RequireRole({ role }: { role?: Role }) {
  const { user, passwordChangeRequired } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (passwordChangeRequired) {
    return <Navigate to={PASSWORD_CHANGE_PATH} replace />;
  }
  if (role && user.role !== role) {
    return <Navigate to={HOME_BY_ROLE[user.role]} replace />;
  }
  return <Outlet />;
}
