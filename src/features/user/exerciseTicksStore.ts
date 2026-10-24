// El tildado serie por serie de un ejercicio (CU-U-12) es solo de la interfaz: el backend guarda el
// ejercicio completo cuando el alumno lo termina, no cada serie. Vive acá, fuera de React, como el
// temporizador: el alumno tilda una serie, se va al temporizador a descansar y, al volver, sigue donde
// estaba. No persiste nada: si se recarga la página, arranca de cero.

import { assignmentKey, type RoutineAssignment } from './routineDetail';

const NONE: ReadonlySet<number> = new Set();

let ticks: ReadonlyMap<string, ReadonlySet<number>> = new Map();
const listeners = new Set<() => void>();

/**
 * La clave de un ejercicio de una asignación de un usuario. Lleva el usuario para que otra cuenta que
 * entra en el mismo navegador no herede las series tildadas.
 */
export function ticksKey(
  userId: string,
  assignment: RoutineAssignment,
  routineExerciseId: string,
): string {
  return `${userId}|${assignmentKey(assignment)}|${routineExerciseId}`;
}

/** Las series tildadas del ejercicio, por su posición (desde 0). Es el mismo objeto hasta que algo cambia. */
export function getSetTicks(key: string): ReadonlySet<number> {
  return ticks.get(key) ?? NONE;
}

/** Para `useSyncExternalStore`: avisa cuando cambia algo. Devuelve cómo dejar de escuchar. */
export function subscribeSetTicks(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Tilda la serie, o le saca el tilde si ya lo tenía. */
export function toggleSetTick(key: string, index: number): void {
  const next = new Set(getSetTicks(key));
  if (!next.delete(index)) next.add(index);

  const map = new Map(ticks);
  if (next.size === 0) map.delete(key);
  else map.set(key, next);
  ticks = map;
  listeners.forEach((listener) => listener());
}
