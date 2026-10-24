import type { To } from 'react-router';

import type { RoutineAssignment } from './routineDetail';

/** El home del alumno. */
export const HOME_PATH = '/u/plan';

/** El detalle de una rutina individual, desde el `id` de su asignación (B2). */
export function individualRoutinePath(assignmentId: string): string {
  return `/u/rutina/${assignmentId}`;
}

/** El detalle de una rutina de una semana del plan, desde las dos ids que trae el home (B2). */
export function planRoutinePath(
  userPlanificationId: string,
  routineAsignationId: string,
): string {
  return `/u/rutina/plan/${userPlanificationId}/${routineAsignationId}`;
}

/** El detalle de la rutina de una asignación, sea individual o de una semana del plan. */
export function routinePath(assignment: RoutineAssignment): string {
  return assignment.kind === 'individual'
    ? individualRoutinePath(assignment.assignmentId)
    : planRoutinePath(
        assignment.userPlanificationId,
        assignment.routineAsignationId,
      );
}

/**
 * El detalle de un ejercicio de la rutina de una asignación (CU-U-10). Cuelga de la ruta de la rutina:
 * el ejercicio sale del mismo detalle y necesita saber de qué asignación es.
 */
export function exercisePath(
  assignment: RoutineAssignment,
  routineExerciseId: string,
): string {
  return `${routinePath(assignment)}/ejercicio/${routineExerciseId}`;
}

/**
 * Lo que el home le pasa al detalle de una rutina por el `state` de la navegación: su búsqueda
 * (`?semana=2026-10-19`), para que "Volver" deje la misma semana. Un detalle abierto de cero (un link
 * directo) no trae nada.
 */
export interface HomeLocationState {
  homeSearch: string;
}

/** A dónde vuelve el detalle: el home con la semana que traía el `state`, o el de esta semana. */
export function homeBackTo(state: unknown): To {
  if (
    typeof state === 'object' &&
    state !== null &&
    'homeSearch' in state &&
    typeof state.homeSearch === 'string' &&
    state.homeSearch.startsWith('?')
  ) {
    return { pathname: HOME_PATH, search: state.homeSearch };
  }
  return HOME_PATH;
}
