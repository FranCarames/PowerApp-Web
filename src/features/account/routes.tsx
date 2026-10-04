import type { RouteObject } from 'react-router';

import { AccountPage } from './pages/AccountPage';
import { PersonalDataPage } from './pages/PersonalDataPage';

/** Mi cuenta, bajo /cuenta. La comparten los tres roles. Va dentro de <AppShell> (lo arma el router). */
export const accountRoutes: RouteObject[] = [
  { index: true, Component: AccountPage },
  { path: 'datos', Component: PersonalDataPage },
];
