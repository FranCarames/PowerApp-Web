import { redirect, type RouteObject } from 'react-router';

import { CircuitEditorPage } from './pages/CircuitEditorPage';
import { CircuitsPage } from './pages/CircuitsPage';
import { MembershipsPage } from './pages/MembershipsPage';
import { PlansPage } from './pages/PlansPage';
import { RegisterPaymentPage } from './pages/RegisterPaymentPage';
import { RoutinesPage } from './pages/RoutinesPage';
import { StudentDetailPage } from './pages/StudentDetailPage';
import { StudentsPage } from './pages/StudentsPage';

/** Pantallas del rol Entrenador, bajo /c. Van dentro de <AppShell> (lo arma el router). */
export const coachRoutes: RouteObject[] = [
  { index: true, loader: () => redirect('/c/alumnos') },
  { path: 'alumnos', Component: StudentsPage },
  { path: 'alumnos/:id', Component: StudentDetailPage },
  { path: 'membresias', Component: MembershipsPage },
  { path: 'pago', Component: RegisterPaymentPage },
  { path: 'planes', Component: PlansPage },
  { path: 'rutinas', Component: RoutinesPage },
  { path: 'circuitos', Component: CircuitsPage },
  { path: 'circuitos/:id', Component: CircuitEditorPage },
];
