import type { RouteObject } from 'react-router';

import { RequireRole } from '@/features/auth/components/RequireRole';

import { AccountPage } from './pages/AccountPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { PersonalDataPage } from './pages/PersonalDataPage';

/** Mi cuenta, bajo /cuenta. La comparten los tres roles. Va dentro de <AppShell> (lo arma el router). */
export const accountRoutes: RouteObject[] = [
  { index: true, Component: AccountPage },
  { path: 'datos', Component: PersonalDataPage },
  // El historial de pagos es solo del alumno: coach y admin vuelven a su inicio.
  {
    path: 'pagos',
    element: <RequireRole role="user" />,
    children: [{ index: true, Component: PaymentsPage }],
  },
];
