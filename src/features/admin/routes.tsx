import { redirect, type RouteObject } from 'react-router';

import { WIDE_SCREEN } from '@/shared/lib/routeHandle';

import { CatalogPage } from './pages/CatalogPage';
import { CircuitEditorPage } from './pages/CircuitEditorPage';
import { CircuitsPage } from './pages/CircuitsPage';
import { CircuitTypesPage } from './pages/CircuitTypesPage';
import { CoachesPage } from './pages/CoachesPage';
import { ConvertPage } from './pages/ConvertPage';
import { DashboardPage } from './pages/DashboardPage';
import { ExerciseEditorPage } from './pages/ExerciseEditorPage';
import { ExercisesPage } from './pages/ExercisesPage';
import { MembershipTypesPage } from './pages/MembershipTypesPage';
import { MorePage } from './pages/MorePage';
import { PlanEditorPage } from './pages/PlanEditorPage';
import { PlansPage } from './pages/PlansPage';
import { RoutineAddCircuitsPage } from './pages/RoutineAddCircuitsPage';
import { RoutineEditorPage } from './pages/RoutineEditorPage';
import { RoutinesPage } from './pages/RoutinesPage';
import { UsersPage } from './pages/UsersPage';

/** Pantallas del rol Admin, bajo /a. Van dentro de <AppShell> (lo arma el router). */
export const adminRoutes: RouteObject[] = [
  { index: true, loader: () => redirect('/a/inicio') },
  { path: 'inicio', Component: DashboardPage },
  { path: 'usuarios', Component: UsersPage },
  { path: 'entrenadores', Component: CoachesPage },
  { path: 'convertir', Component: ConvertPage },
  { path: 'ejercicios', Component: ExercisesPage },
  { path: 'ejercicios/:id', Component: ExerciseEditorPage },
  { path: 'circuitos', Component: CircuitsPage },
  { path: 'circuitos/:id', Component: CircuitEditorPage },
  { path: 'rutinas', Component: RoutinesPage },
  // Ancho de escritorio: el formulario y, al costado, la biblioteca de circuitos.
  { path: 'rutinas/:id', Component: RoutineEditorPage, handle: WIDE_SCREEN },
  // Elegir circuitos para la rutina en el celular y la tablet (en escritorio, la biblioteca del editor).
  { path: 'rutinas/:id/agregar-circuitos', Component: RoutineAddCircuitsPage },
  { path: 'planes', Component: PlansPage },
  { path: 'planes/:id', Component: PlanEditorPage },
  { path: 'catalogo', Component: CatalogPage },
  { path: 'membresias', Component: MembershipTypesPage },
  { path: 'tipos-circuito', Component: CircuitTypesPage },
  { path: 'mas', Component: MorePage },
];
