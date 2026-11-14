import { redirect, type RouteObject } from 'react-router';

import { MusclePage } from '@/features/catalog/pages/MusclePage';
import { MusclesIndexPage } from '@/features/catalog/pages/MusclesIndexPage';
import { WikiExercisePage } from '@/features/catalog/pages/WikiExercisePage';
import { WikiPage } from '@/features/catalog/pages/WikiPage';

import { CalculatorPage } from './pages/CalculatorPage';
import { PlanPage } from './pages/PlanPage';
import { RmsPage } from './pages/RmsPage';
import { RoutineDetailPage } from './pages/RoutineDetailPage';
import { RoutineExercisePage } from './pages/RoutineExercisePage';
import { TimerPage } from './pages/TimerPage';

/** Pantallas del rol Usuario, bajo /u. Van dentro de <AppShell> (lo arma el router). */
export const userRoutes: RouteObject[] = [
  { index: true, loader: () => redirect('/u/plan') },
  { path: 'plan', Component: PlanPage },
  { path: 'rutina/:id', Component: RoutineDetailPage },
  {
    path: 'rutina/:id/ejercicio/:routineExerciseId',
    Component: RoutineExercisePage,
  },
  {
    path: 'rutina/plan/:userPlanificationId/:routineAsignationId',
    Component: RoutineDetailPage,
  },
  {
    path: 'rutina/plan/:userPlanificationId/:routineAsignationId/ejercicio/:routineExerciseId',
    Component: RoutineExercisePage,
  },
  { path: 'rms', Component: RmsPage },
  { path: 'calculadora', Component: CalculatorPage },
  { path: 'timer', Component: TimerPage },
  // La biblioteca de ejercicios es compartida con el Entrenador (`/c/ejercicios`).
  { path: 'wiki', element: <WikiPage basePath="/u/wiki" back="/u/plan" /> },
  // Los músculos por grupo y la página de cada uno. `musculos` es fijo: le gana a `wiki/:id`.
  {
    path: 'wiki/musculos',
    element: <MusclesIndexPage basePath="/u/wiki" back="/u/plan" />,
  },
  { path: 'wiki/musculos/:id', element: <MusclePage basePath="/u/wiki" /> },
  { path: 'wiki/:id', element: <WikiExercisePage basePath="/u/wiki" /> },
];
