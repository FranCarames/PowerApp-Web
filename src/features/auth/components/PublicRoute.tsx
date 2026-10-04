import { Navigate, Outlet } from 'react-router';

import { useAuth } from '../hooks/useAuth';
import { PASSWORD_CHANGE_PATH } from '../homePath';

/**
 * Pantallas que se pueden ver sin sesión (login, registro, recuperar y las direcciones que no
 * existen). Con un cambio de contraseña pendiente, la única pantalla permitida es
 * /cambiar-contrasena.
 */
export function PublicRoute() {
  const { passwordChangeRequired } = useAuth();

  if (passwordChangeRequired) {
    return <Navigate to={PASSWORD_CHANGE_PATH} replace />;
  }
  return <Outlet />;
}
