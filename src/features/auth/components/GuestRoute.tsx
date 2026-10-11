import { Navigate, Outlet } from 'react-router';

import { useAuth } from '../hooks/useAuth';
import { homePathFor } from '../homePath';

/**
 * Pantallas que piden que no haya sesión (login, registro y recuperar: precondición de CU-U-01,
 * CU-U-02 y CU-U-04). Con una sesión abierta lleva al inicio de su rol, o a /cambiar-contrasena si
 * tiene el cambio pendiente.
 */
export function GuestRoute() {
  const { user, passwordChangeRequired } = useAuth();

  if (user) {
    return (
      <Navigate to={homePathFor({ user, passwordChangeRequired })} replace />
    );
  }
  return <Outlet />;
}
