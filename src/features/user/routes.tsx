import { redirect, type RouteObject } from 'react-router';

import { PlanPage } from './pages/PlanPage';
import { RmsPage } from './pages/RmsPage';
import { TimerPage } from './pages/TimerPage';

/** Pantallas del rol Usuario, bajo /u. Van dentro de <AppShell> (lo arma el router). */
export const userRoutes: RouteObject[] = [
  { index: true, loader: () => redirect('/u/plan') },
  { path: 'plan', Component: PlanPage },
  { path: 'rms', Component: RmsPage },
  { path: 'timer', Component: TimerPage },
];
