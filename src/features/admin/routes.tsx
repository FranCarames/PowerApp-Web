import { redirect, type RouteObject } from 'react-router';

import { CatalogPage } from './pages/CatalogPage';
import { CircuitEditorPage } from './pages/CircuitEditorPage';
import { CircuitsPage } from './pages/CircuitsPage';
import { CoachesPage } from './pages/CoachesPage';
import { DashboardPage } from './pages/DashboardPage';
import { ExercisesPage } from './pages/ExercisesPage';
import { MembershipTypesPage } from './pages/MembershipTypesPage';
import { MorePage } from './pages/MorePage';
import { PlanEditorPage } from './pages/PlanEditorPage';
import { PlansPage } from './pages/PlansPage';
import { RoutineEditorPage } from './pages/RoutineEditorPage';
import { RoutinesPage } from './pages/RoutinesPage';
import { UsersPage } from './pages/UsersPage';

/** Pantallas del rol Admin, bajo /a. Van dentro de <AppShell> (lo arma el router). */
export const adminRoutes: RouteObject[] = [
  { index: true, loader: () => redirect('/a/inicio') },
  { path: 'inicio', Component: DashboardPage },
  { path: 'usuarios', Component: UsersPage },
  { path: 'entrenadores', Component: CoachesPage },
  { path: 'ejercicios', Component: ExercisesPage },
  { path: 'circuitos', Component: CircuitsPage },
  { path: 'circuitos/:id', Component: CircuitEditorPage },
  { path: 'rutinas', Component: RoutinesPage },
  { path: 'rutinas/:id', Component: RoutineEditorPage },
  { path: 'planes', Component: PlansPage },
  { path: 'planes/:id', Component: PlanEditorPage },
  { path: 'catalogo', Component: CatalogPage },
  { path: 'membresias', Component: MembershipTypesPage },
  { path: 'mas', Component: MorePage },
];
