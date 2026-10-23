import type { To } from 'react-router';

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
