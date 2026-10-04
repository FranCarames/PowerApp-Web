import type { Coach, UserPlanification } from './types';

// Tipos provisionales de lo que el contrato (openapi.json) todavía no tiene: las dependencias B1 a
// B9 de PLAN.md, sección 4.1. Cada uno lleva `// PENDIENTE-CONTRATO: <id> <CU>`. Cuando el contrato
// aparece, se borra el provisional, se regeneran los tipos (`npm run api:gen`) y se ajusta el código
// que lo usaba.
//
// Acá solo está lo que el PLAN deja tipar sin inventar: los nombres de los campos salen de las
// entidades del contrato. Del resto (B1 a B6 y B9) el PLAN dice qué necesita el front, pero no cómo
// se llaman los campos ni los endpoints: lo tipa la tarea que lo usa (B1: T38; B2: T39 y T40; B3 y
// B4: T40; B5: T42 y T38; B6: T43; B9: T09 y T44).

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
