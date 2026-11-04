import type { Day } from '@/shared/lib/trainingHistory';

/*
 * Lo que comparten el historial de entrenamientos (`/c/alumnos/:id/historial`) y la ficha del alumno:
 * los parámetros de la URL, el `state` de la navegación y el foco al volver (spec del 4/11, secciones 3
 * y 11).
 */

/** La ruta del historial de un alumno. */
export function historyPath(studentId: string): string {
  return `/c/alumnos/${studentId}/historial`;
}

/** El `id` del título de una semana de la lista: la barra del gráfico le lleva el foco (spec 11). */
export function weekHeadingId(monday: Day): string {
  return `historial-semana-${monday}`;
}

/**
 * El `state` del detalle de un ejercicio abierto desde la lista: con él, «Todo el historial» hace lo
 * mismo que «atrás» (sección 3). Si se entró por un link o recargando, no está.
 */
export const FROM_LIST_STATE = { historyFromList: true } as const;

export function openedFromList(state: unknown): boolean {
  return (
    typeof state === 'object' &&
    state !== null &&
    'historyFromList' in state &&
    state.historyFromList === true
  );
}

/** El `state` de «Volver» del historial: la ficha devuelve el foco a la fila del historial. */
export const RETURN_TO_ROW_STATE = { focusHistoryRow: true } as const;

export function returningToRow(state: unknown): boolean {
  return (
    typeof state === 'object' &&
    state !== null &&
    'focusHistoryRow' in state &&
    state.focusHistoryRow === true
  );
}

// El alumno del último historial que se cerró. Con «atrás» del navegador la ficha vuelve con el `state`
// que tenía al salir, así que es la única forma de saber que se vuelve del historial.
let lastHistoryClosed: string | null = null;

/** Lo llama el historial al desmontarse. */
export function rememberHistoryClosed(studentId: string): void {
  lastHistoryClosed = studentId;
}

/** Si el último historial que se cerró es el de este alumno. Lo consume: la próxima vez da `false`. */
export function takeHistoryClosed(studentId: string): boolean {
  const closed = lastHistoryClosed === studentId;
  lastHistoryClosed = null;
  return closed;
}
