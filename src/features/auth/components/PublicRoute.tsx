import { Navigate, Outlet } from 'react-router';

import { useAuth } from '../hooks/useAuth';
import { PASSWORD_CHANGE_PATH } from '../homePath';

/**
 * Pantallas que se ven con o sin sesión (las direcciones que no existen). Con un cambio de
 * contraseña pendiente, la única pantalla permitida es /cambiar-contrasena. Login, registro y
 * recuperar no van acá sino en <GuestRoute>, que además saca a quien ya tiene sesión.
 */
export function PublicRoute() {
  const { passwordChangeRequired } = useAuth();

  if (passwordChangeRequired) {
    return <Navigate to={PASSWORD_CHANGE_PATH} replace />;
  }
  return <Outlet />;
}
