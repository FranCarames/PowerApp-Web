import { redirect, type RouteObject } from 'react-router';

import { MusclePage } from '@/features/catalog/pages/MusclePage';
import { WikiExercisePage } from '@/features/catalog/pages/WikiExercisePage';
import { WIDE_SCREEN } from '@/shared/lib/routeHandle';

import { AssignPlanPage } from './pages/AssignPlanPage';
import { AssignRoutinePage } from './pages/AssignRoutinePage';
import { AssignStudentPlanPage } from './pages/AssignStudentPlanPage';
import { AssignStudentRoutinePage } from './pages/AssignStudentRoutinePage';
import { CircuitEditorPage } from './pages/CircuitEditorPage';
import { CircuitsPage } from './pages/CircuitsPage';
import { ExercisesPage } from './pages/ExercisesPage';
import { MembershipsPage } from './pages/MembershipsPage';
import { MusclesPage } from './pages/MusclesPage';
import { PlanEditorPage } from './pages/PlanEditorPage';
import { PlansPage } from './pages/PlansPage';
import { RegisterPaymentPage } from './pages/RegisterPaymentPage';
import { RoutineAddCircuitsPage } from './pages/RoutineAddCircuitsPage';
import { RoutineEditorPage } from './pages/RoutineEditorPage';
import { RoutinesPage } from './pages/RoutinesPage';
import { StudentDetailPage } from './pages/StudentDetailPage';
import { StudentHistoryPage } from './pages/StudentHistoryPage';
import { StudentsPage } from './pages/StudentsPage';

/** Pantallas del rol Entrenador, bajo /c. Van dentro de <AppShell> (lo arma el router). */
export const coachRoutes: RouteObject[] = [
  { index: true, loader: () => redirect('/c/alumnos') },
  { path: 'alumnos', Component: StudentsPage },
  { path: 'alumnos/:id', Component: StudentDetailPage },
  // El historial de entrenamientos (CU-E-06 y CU-E-07), con ?vista, ?mes y ?ejercicio.
  { path: 'alumnos/:id/historial', Component: StudentHistoryPage },
  { path: 'alumnos/:id/asignar', Component: AssignStudentPlanPage },
  { path: 'alumnos/:id/asignar-rutina', Component: AssignStudentRoutinePage },
  { path: 'membresias', Component: MembershipsPage },
  { path: 'pago', Component: RegisterPaymentPage },
  { path: 'planes', Component: PlansPage },
  { path: 'planes/:id', Component: PlanEditorPage },
  { path: 'planes/:id/asignar', Component: AssignPlanPage },
  { path: 'rutinas', Component: RoutinesPage },
  // Ancho de escritorio: el formulario y, al costado, la biblioteca de circuitos.
  { path: 'rutinas/:id', Component: RoutineEditorPage, handle: WIDE_SCREEN },
  { path: 'rutinas/:id/asignar', Component: AssignRoutinePage },
  // Elegir circuitos para la rutina en el celular y la tablet (en escritorio, la biblioteca del editor).
  { path: 'rutinas/:id/agregar-circuitos', Component: RoutineAddCircuitsPage },
  { path: 'circuitos', Component: CircuitsPage },
  { path: 'circuitos/:id', Component: CircuitEditorPage },
  // La biblioteca de ejercicios, solo de lectura: la misma ficha que la wiki del Usuario.
  { path: 'ejercicios', Component: ExercisesPage },
  // Los músculos por grupo y la página de cada uno. `musculos` es fijo: le gana a `ejercicios/:id`.
  { path: 'ejercicios/musculos', Component: MusclesPage },
  {
    path: 'ejercicios/musculos/:id',
    element: <MusclePage basePath="/c/ejercicios" />,
  },
  {
    path: 'ejercicios/:id',
    element: <WikiExercisePage basePath="/c/ejercicios" />,
  },
];
