import { createBrowserRouter, type RouteObject } from 'react-router';

import type { Role } from '@/api/types';
import { accountRoutes } from '@/features/account/routes';
import { adminRoutes } from '@/features/admin/routes';
import { AuthLayout } from '@/features/auth/components/AuthLayout';
import { RequireRole } from '@/features/auth/components/RequireRole';
import { authRoutes } from '@/features/auth/routes';
import { coachRoutes } from '@/features/coach/routes';
import { userRoutes } from '@/features/user/routes';

import { AppShell } from './AppShell/AppShell';
import { devRoutes } from './dev/devRoutes';
import { HomeRedirect } from './HomeRedirect';
import { NotFoundPage } from './NotFoundPage';
import { RootLayout } from './RootLayout';
import { RouteError } from './RouteError';

/** Una zona con sesión: el guard de rol, el marco (barra lateral y tab bar) y las pantallas. */
function shellRoute(
  path: string,
  role: Role | undefined,
  children: RouteObject[],
): RouteObject {
  return {
    path,
    element: <RequireRole role={role} />,
    children: [{ Component: AppShell, children }],
  };
}

export const router = createBrowserRouter([
  ...devRoutes,
  {
    Component: RootLayout,
    ErrorBoundary: RouteError,
    children: [
      { index: true, Component: HomeRedirect },
      {
        Component: AuthLayout,
        children: [...authRoutes, { path: '*', Component: NotFoundPage }],
      },
      shellRoute('u', 'user', userRoutes),
      shellRoute('c', 'coach', coachRoutes),
      shellRoute('a', 'admin', adminRoutes),
      // Mi cuenta es de los tres roles: alcanza con tener sesión.
      shellRoute('cuenta', undefined, accountRoutes),
    ],
  },
]);
