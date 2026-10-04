import type { RouteObject } from 'react-router';

import { AccountPage } from './pages/AccountPage';

/** Mi cuenta, bajo /cuenta. La comparten los tres roles. Va dentro de <AppShell> (lo arma el router). */
export const accountRoutes: RouteObject[] = [
  { index: true, Component: AccountPage },
];
