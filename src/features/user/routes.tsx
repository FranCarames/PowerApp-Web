import { redirect, type RouteObject } from 'react-router';

import { CalculatorPage } from './pages/CalculatorPage';
import { PlanPage } from './pages/PlanPage';
import { RmsPage } from './pages/RmsPage';
import { RoutineDetailPage } from './pages/RoutineDetailPage';
import { TimerPage } from './pages/TimerPage';
import { WikiExercisePage } from './pages/WikiExercisePage';
import { WikiPage } from './pages/WikiPage';

/** Pantallas del rol Usuario, bajo /u. Van dentro de <AppShell> (lo arma el router). */
export const userRoutes: RouteObject[] = [
  { index: true, loader: () => redirect('/u/plan') },
  { path: 'plan', Component: PlanPage },
  { path: 'rutina/:id', Component: RoutineDetailPage },
  {
    path: 'rutina/plan/:userPlanificationId/:routineAsignationId',
    Component: RoutineDetailPage,
  },
  { path: 'rms', Component: RmsPage },
  { path: 'calculadora', Component: CalculatorPage },
  { path: 'timer', Component: TimerPage },
  { path: 'wiki', Component: WikiPage },
  { path: 'wiki/:id', Component: WikiExercisePage },
];
