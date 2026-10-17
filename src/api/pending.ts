import type { paths } from './schema';
import type {
  CircuitDetailResponse,
  CircuitExerciseResponse,
  Coach,
  Exercise,
  Muscle,
  MuscleGroup,
  UserPlanification,
} from './types';

// Tipos provisionales de lo que el contrato (openapi.json) todavía no tiene: las dependencias B1 a
// B9 de PLAN.md, sección 4.1. Cada uno lleva `// PENDIENTE-CONTRATO: <id> <CU>`. Cuando el contrato
// aparece, se borra el provisional, se regeneran los tipos (`npm run api:gen`) y se ajusta el código
// que lo usaba.
//
// Acá solo está lo que el PLAN deja tipar sin inventar: los nombres de los campos salen de las
// entidades del contrato. Del resto (B1 a B6) el PLAN dice qué necesita el front, pero no cómo se
// llaman los campos ni los endpoints: lo tipa la tarea que lo usa (B1: T38; B2: T39 y T40; B3 y B4:
// T40; B5: T42 y T38; B6: T43).

// PENDIENTE-CONTRATO: B7 CU-E-13
/**
 * Body de `POST /planification/user/assign` y de `POST /planification/user/edit/{id}`: alumno,
 * planificación, fechas y nota. Los campos y su opcionalidad son los de `UserPlanification`.
 * Falta lo que B7 también pide y el PLAN no define: cómo se informa un solapamiento con un plan
 * vigente y cómo se confirma igual.
 */
export type UserPlanificationRequest = Pick<
  UserPlanification,
  'user_id' | 'planification_id' | 'start_date' | 'end_date' | 'coach_note'
>;

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

// PENDIENTE-CONTRATO: B8 CU-A-18
/**
 * Body de `POST /coach/edit/{id}` para editar un entrenador: sus dos campos editables, `coach_email` y
 * `cuil`. El endpoint no existe en el contrato (ni en el `CoachController` del backend al 6/10): el
 * path, la forma del body y la respuesta (el `Coach` ya guardado) son una propuesta del front, con el
 * mismo estilo que `POST /membership/edit/{id}` y `POST /muscles/edit/{id}`.
 */
export type EditCoachRequest = Pick<Coach, 'coach_email' | 'cuil'>;

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
