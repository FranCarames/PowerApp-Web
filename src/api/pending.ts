import type { paths } from './schema';
import type {
  CircuitDetailResponse,
  CircuitExerciseResponse,
  Exercise,
  Muscle,
  MuscleGroup,
  RoutineAssignedDetail,
  RoutineDetail,
  RoutineDetailCircuit,
  RoutinePlanSessionDetail,
} from './types';

// Tipos provisionales de lo que el contrato (openapi.json) declara mal o no declara: los puntos V1,
// V2 y V9 de PLAN.md, sección 4.3. Cada uno lleva `// PENDIENTE-CONTRATO: <id> <CU>`. Cuando el
// contrato lo corrige, se borra el provisional, se regeneran los tipos (`npm run api:gen`) y se
// ajusta el código que lo usaba.
//
// Las dependencias B1 a B9 (rutinas del alumno, ejecución, rutina puntual, historial, planificaciones
// de un alumno, editar entrenador y contraseña temporal) ya están en el contrato: sus tipos salen de
// `types.ts` y no hay provisionales.

// PENDIENTE-CONTRATO: V2 CU-E-22
/**
 * El ejercicio dentro de un circuito (`exercise` de `CircuitExerciseResponseDto`): el contrato lo declara
 * como un objeto vacío, pero el backend manda la ficha del catálogo (`buildCircuitDetailResponse`).
 */
export interface CircuitExerciseRef {
  id: string;
  name: string;
  description: string;
  safety_tips?: string;
  activation_tips?: string;
  video_url?: string;
  preview_image?: string;
  bg_image?: string;
}

// PENDIENTE-CONTRATO: V2 CU-E-22
/**
 * Respuesta de `GET /routine/circuit/{id}` y de `POST /routine/circuit/create` y `edit/{id}`: el
 * `CircuitDetailResponseDto` del contrato con el `exercise` de cada ejercicio tipado. Trae solo los
 * ejercicios activos, en orden, cada uno con sus bloques de series.
 */
export type CircuitDetail = Omit<CircuitDetailResponse, 'exercises'> & {
  exercises: Array<
    Omit<CircuitExerciseResponse, 'exercise'> & { exercise: CircuitExerciseRef }
  >;
};

// PENDIENTE-CONTRATO: V2 CU-U-09
/**
 * El árbol de una rutina (`routine` de los dos detalles del alumno, igual al de `GET /routine/{id}`): el
 * `RoutineDetailResponseDto` con el circuito de cada vínculo tipado como `CircuitDetail`, que es el
 * formato de `GET /routine/circuit/{id}` y trae la ficha del catálogo en el `exercise` de cada ejercicio.
 */
export type RoutineTree = Omit<RoutineDetail, 'circuits'> & {
  circuits: Array<
    Omit<RoutineDetailCircuit, 'circuit'> & { circuit: CircuitDetail }
  >;
};

// PENDIENTE-CONTRATO: V2 CU-U-09
/**
 * El árbol de la rutina en los dos detalles del alumno: el de `RoutineTree`, salvo el `order` de cada
 * vínculo. Un circuito que el entrenador sacó de la rutina después de que el alumno hizo algo de él se
 * sigue mandando (CU-U-09), con `order: null`: el backend lo apaga sin posición. El contrato declara el
 * `order` como número porque, para el entrenador, los vínculos apagados no se devuelven.
 */
export type StudentRoutineTree = Omit<RoutineTree, 'circuits'> & {
  circuits: Array<
    Omit<RoutineTree['circuits'][number], 'order'> & { order: number | null }
  >;
};

// PENDIENTE-CONTRATO: V2 CU-U-09
/** Respuesta de `GET /routine/assign-user/{id}`: el contrato con el árbol de la rutina tipado. */
export type AssignedRoutineDetail = Omit<RoutineAssignedDetail, 'routine'> & {
  routine: StudentRoutineTree;
};

// PENDIENTE-CONTRATO: V2 CU-U-09
/** Respuesta de `GET /routine/assign-plan/{userPlanificationId}/{routineAsignationId}`, con el árbol tipado. */
export type PlanSessionDetail = Omit<RoutinePlanSessionDetail, 'routine'> & {
  routine: StudentRoutineTree;
};

// PENDIENTE-CONTRATO: V1 CU-E-27
/** Los estados que acepta el filtro `status` de `GET /membership/status/users`, los del contrato. */
export type MembershipStatusFilter = NonNullable<
  paths['/api/v1/membership/status/users']['get']['parameters']['query']
>['status'];

// PENDIENTE-CONTRATO: V1 CU-E-27
/** Un alumno de la respuesta de `GET /membership/status/users` (`StudentMembershipDto` del backend). */
export interface StudentMembership {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  membership_status: MembershipStatusFilter;
  /** Vencimiento del último pago; `null` si nunca pagó. */
  expired_at: string | null;
  /** Tipo del último pago; `null` si nunca pagó. */
  membership_name: string | null;
  membership_id: string | null;
}

// PENDIENTE-CONTRATO: V1 CU-E-27
/**
 * Respuesta de `GET /membership/status/users?status=…`: los alumnos con ese estado de membresía,
 * ordenados por apellido y nombre. El contrato la declara sin cuerpo; la forma sale del código del
 * backend (`getStudentsByMembershipStatus`).
 */
export interface StudentsByMembershipStatus {
  status: MembershipStatusFilter;
  total: number;
  expiring_soon_days: number;
  students: StudentMembership[];
}

// PENDIENTE-CONTRATO: V9 CU-A-01
/**
 * Un músculo tal como lo trae un ejercicio en `exercisedMuscles`: el `id` es el del músculo, no el
 * del vínculo `Exercised_Muscle`. Sale del código del backend (`ExerciseService`).
 */
export interface ExerciseMuscle {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  preview_image?: string;
}

// PENDIENTE-CONTRATO: V9 CU-A-01
/**
 * Un ejercicio con sus músculos, como los manda `GET /exercise/all`: el `Exercise` del contrato más
 * `exercisedMuscles`, que el Swagger no declara. `GET /exercise/{id}` los manda distinto
 * (`ExerciseDetailResponse`) y `useExercise` lo lleva a esta forma.
 */
export type ExerciseWithMuscles = Exercise & {
  exercisedMuscles: ExerciseMuscle[];
};

// PENDIENTE-CONTRATO: V9 CU-A-05
/**
 * Un elemento de `exercisedMuscles` en `GET /exercise/{id}`. A diferencia del listado, el backend
 * no lo aplana: manda el vínculo `Exercised_Muscle` tal cual, con el músculo anidado en `muscle`.
 * El `id` de este nivel es el del vínculo, no el del músculo, y no sirve para `exercised_muscles_ids`.
 */
export interface ExercisedMuscleLink {
  id: string;
  muscle: ExerciseMuscle;
}

// PENDIENTE-CONTRATO: V9 CU-A-05
/**
 * Respuesta de `GET /exercise/{id}` tal como llega. Los músculos pueden venir como vínculos o ya
 * aplanados (la forma del listado), por si el backend unifica los dos.
 */
export type ExerciseDetailResponse = Exercise & {
  exercisedMuscles: Array<ExercisedMuscleLink | ExerciseMuscle>;
};

// PENDIENTE-CONTRATO: V9 CU-A-01
/**
 * Respuesta de `GET /muscles/mg/all`: el `MuscleGroup` del contrato más sus músculos, con el `id`
 * y el `name` (y la `description`), y sin `created_at` ni `updated_at` (el backend recorta las
 * columnas con un `select`). El Swagger no declara `muscles`, pero el backend lo manda.
 */
export type MuscleGroupWithMuscles = Omit<
  MuscleGroup,
  'created_at' | 'updated_at'
> & {
  muscles: Array<Pick<ExerciseMuscle, 'id' | 'name' | 'description'>>;
};

// PENDIENTE-CONTRATO: V9 CU-A-07
/**
 * Un elemento de `GET /muscles/all`: el `Muscle` del contrato, pero con su grupo anidado en
 * `muscle_group` (`id` y `name`) y sin `muscle_group_id`, `created_at` ni `updated_at`: el backend
 * recorta las columnas con un `select`.
 */
export type MuscleWithGroup = Pick<
  Muscle,
  'id' | 'name' | 'description' | 'image_url' | 'preview_image'
> & { muscle_group: Pick<MuscleGroup, 'id' | 'name'> };

// PENDIENTE-CONTRATO: V1 CU-E-28
/** Un grupo de la respuesta de `GET /membership/type/users` (`MembershipTypeGroupDto` del backend). */
export interface StudentsByMembershipTypeGroup {
  membership_id: string | null;
  membership_name: string;
  total: number;
  students: StudentMembership[];
}

// PENDIENTE-CONTRATO: V1 CU-E-28
/**
 * Respuesta de `GET /membership/type/users` sin `membership_id`: los alumnos agrupados por el tipo de
 * su último pago. Solo hay grupos de los tipos con alumnos, y los que nunca pagaron no entran en
 * ninguno (`without_payments`). El contrato la declara sin cuerpo; la forma sale del código del
 * backend (`getStudentsByMembershipType`). Con `membership_id` responde `{ total, students }`.
 */
export interface StudentsByMembershipType {
  total_students: number;
  without_payments: number;
  groups: StudentsByMembershipTypeGroup[];
}
