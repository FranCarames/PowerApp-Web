import type { RouteObject } from 'react-router';

import { PublicRoute } from './components/PublicRoute';
import { RequireSession } from './components/RequireSession';
import { ChangePasswordPage } from './pages/ChangePasswordPage';
import { LoginPage } from './pages/LoginPage';
import { RecoverPage } from './pages/RecoverPage';
import { RegisterPage } from './pages/RegisterPage';

/**
 * Pantallas de acceso. Van dentro de <AuthLayout> (lo arma el router). Login, registro y recuperar se
 * ven sin sesión; el cambio de contraseña pide una.
 */
export const authRoutes: RouteObject[] = [
  {
    Component: PublicRoute,
    children: [
      { path: 'login', Component: LoginPage },
      { path: 'registro', Component: RegisterPage },
      { path: 'recuperar', Component: RecoverPage },
    ],
  },
  {
    Component: RequireSession,
    children: [{ path: 'cambiar-contrasena', Component: ChangePasswordPage }],
  },
];
