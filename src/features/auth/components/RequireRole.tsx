import { Navigate, Outlet } from 'react-router';

import type { Role } from '@/api/types';

import { useAuth } from '../hooks/useAuth';
import { HOME_BY_ROLE } from '../roles';

/**
 * Guard de ruta. Sin sesión lleva a /login; con `role`, quien tiene otro rol vuelve a su inicio.
 * Sin `role` alcanza con estar logueado (Mi cuenta es de los tres roles).
 */
export function RequireRole({ role }: { role?: Role }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    return <Navigate to={HOME_BY_ROLE[user.role]} replace />;
  }
  return <Outlet />;
}
