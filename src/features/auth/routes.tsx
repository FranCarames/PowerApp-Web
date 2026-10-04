import type { RouteObject } from 'react-router';

import { ChangePasswordPage } from './pages/ChangePasswordPage';
import { LoginPage } from './pages/LoginPage';
import { RecoverPage } from './pages/RecoverPage';
import { RegisterPage } from './pages/RegisterPage';

/** Pantallas de acceso. Van dentro de <AuthLayout> (lo arma el router). */
export const authRoutes: RouteObject[] = [
  { path: 'login', Component: LoginPage },
  { path: 'registro', Component: RegisterPage },
  { path: 'recuperar', Component: RecoverPage },
  { path: 'cambiar-contrasena', Component: ChangePasswordPage },
];
