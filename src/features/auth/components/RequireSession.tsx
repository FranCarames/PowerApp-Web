import { Navigate, Outlet } from 'react-router';

import { useAuth } from '../hooks/useAuth';

/**
 * Guard de ruta para lo que pide sesión pero no un rol ni un cambio de contraseña ya hecho:
 * /cambiar-contrasena, que es donde termina quien entró con una contraseña temporal. Sin sesión
 * lleva a /login.
 */
export function RequireSession() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}
