import { Outlet } from 'react-router';

import { AuthCard } from './AuthCard';

/** Layout de las pantallas de acceso: login, registro, recuperar y cambiar contraseña. */
export function AuthLayout() {
  return (
    <AuthCard>
      <Outlet />
    </AuthCard>
  );
}
