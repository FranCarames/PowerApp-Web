import type { paths } from './schema';
import type {
  Coach,
  Exercise,
  MuscleGroup,
  User,
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
// T40; B5: T42 y T38; B6: T43). B9 lo tipó T09, con un nombre de campo propuesto por el front.

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

// PENDIENTE-CONTRATO: B8 CU-A-18
/** Body para editar un entrenador: sus dos campos editables, `coach_email` y `cuil`. */
export type EditCoachRequest = Pick<Coach, 'coach_email' | 'cuil'>;

// PENDIENTE-CONTRATO: B9 CU-U-02
/**
 * Respuesta de `POST /users/login`: el `User` de siempre más el aviso de que entró con una contraseña
 * temporal y tiene que cambiarla. El contrato todavía no lo trae: el nombre `password_change_required`
 * es una propuesta del front y se ajusta cuando Fran defina el contrato. Falta o `false` es una
 * contraseña común. Mientras el backend no lo mande, solo lo manda el mock de las cuentas de demo.
 */
export type LoginResponse = User & { password_change_required?: boolean };

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
 * Respuesta de `GET /exercise/all` y `GET /exercise/{id}`: el `Exercise` del contrato más sus
 * músculos. El Swagger no declara `exercisedMuscles`, pero el backend lo manda siempre.
 */
export type ExerciseWithMuscles = Exercise & {
  exercisedMuscles: ExerciseMuscle[];
};

// PENDIENTE-CONTRATO: V9 CU-A-01
/**
 * Respuesta de `GET /muscles/mg/all`: el `MuscleGroup` del contrato más sus músculos, con el `id`
 * y el `name` (y la `description`). El Swagger no declara `muscles`, pero el backend lo manda.
 */
export type MuscleGroupWithMuscles = MuscleGroup & {
  muscles: Array<Pick<ExerciseMuscle, 'id' | 'name' | 'description'>>;
};
