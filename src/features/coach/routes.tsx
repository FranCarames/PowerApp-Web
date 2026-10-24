import { redirect, type RouteObject } from 'react-router';

import { AssignPlanPage } from './pages/AssignPlanPage';
import { AssignRoutinePage } from './pages/AssignRoutinePage';
import { AssignStudentPlanPage } from './pages/AssignStudentPlanPage';
import { AssignStudentRoutinePage } from './pages/AssignStudentRoutinePage';
import { CircuitEditorPage } from './pages/CircuitEditorPage';
import { CircuitsPage } from './pages/CircuitsPage';
import { MembershipsPage } from './pages/MembershipsPage';
import { PlanEditorPage } from './pages/PlanEditorPage';
import { PlansPage } from './pages/PlansPage';
import { RegisterPaymentPage } from './pages/RegisterPaymentPage';
import { RoutineEditorPage } from './pages/RoutineEditorPage';
import { RoutinesPage } from './pages/RoutinesPage';
import { StudentDetailPage } from './pages/StudentDetailPage';
import { StudentsPage } from './pages/StudentsPage';

/** Pantallas del rol Entrenador, bajo /c. Van dentro de <AppShell> (lo arma el router). */
export const coachRoutes: RouteObject[] = [
  { index: true, loader: () => redirect('/c/alumnos') },
  { path: 'alumnos', Component: StudentsPage },
  { path: 'alumnos/:id', Component: StudentDetailPage },
  { path: 'alumnos/:id/asignar', Component: AssignStudentPlanPage },
  { path: 'alumnos/:id/asignar-rutina', Component: AssignStudentRoutinePage },
  { path: 'membresias', Component: MembershipsPage },
  { path: 'pago', Component: RegisterPaymentPage },
  { path: 'planes', Component: PlansPage },
  { path: 'planes/:id', Component: PlanEditorPage },
  { path: 'planes/:id/asignar', Component: AssignPlanPage },
  { path: 'rutinas', Component: RoutinesPage },
  { path: 'rutinas/:id', Component: RoutineEditorPage },
  { path: 'rutinas/:id/asignar', Component: AssignRoutinePage },
  { path: 'circuitos', Component: CircuitsPage },
  { path: 'circuitos/:id', Component: CircuitEditorPage },
];
