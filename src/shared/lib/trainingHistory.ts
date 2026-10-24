import type { RoutineHistorySession } from '@/api/types';

/** Un ejercicio del catálogo, como lo trae el historial: el `id` es el que se manda en `exercise_id`. */
export interface HistoryExercise {
  id: string;
  name: string;
}

/**
 * Los ejercicios distintos que aparecen en las sesiones, por nombre. Con la lista completa del
 * historial (sin filtrar), son los que el alumno hizo alguna vez.
 */
export function exercisesInHistory(
  sessions: readonly RoutineHistorySession[],
): HistoryExercise[] {
  const found = new Map<string, string>();
  for (const session of sessions) {
    for (const { exercise } of session.exercises) {
      found.set(exercise.id, exercise.name);
    }
  }
  return [...found]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

/**
 * La clave de una sesión en una lista. Las individuales traen `assignment_id`; las del plan (BE-20d)
 * no lo van a traer, así que la clave suma la rutina, el día y la posición.
 */
export function sessionKey(
  session: RoutineHistorySession,
  index: number,
): string {
  return `${session.source}-${session.routine.id}-${session.date}-${index}`;
}
