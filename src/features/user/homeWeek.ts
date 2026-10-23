import type { RoutineAssignedProgress } from '@/api/types';

/** Una rutina está hecha cuando el alumno hizo todos sus ejercicios (y tiene alguno). */
export function isDone({ finished, total }: RoutineAssignedProgress): boolean {
  return total > 0 && finished >= total;
}

/** Los ejercicios hechos y el total de varias rutinas juntas. */
export function sumProgress(
  items: readonly RoutineAssignedProgress[],
): RoutineAssignedProgress {
  return items.reduce(
    (sum, { finished, total }) => ({
      finished: sum.finished + finished,
      total: sum.total + total,
    }),
    { finished: 0, total: 0 },
  );
}

/** El porcentaje hecho, de 0 a 100. Sin ejercicios es 0. */
export function progressPercent({
  finished,
  total,
}: RoutineAssignedProgress): number {
  return total > 0 ? Math.round((finished / total) * 100) : 0;
}

/** "2 de 5 ejercicios", "1 de 1 ejercicio" o "Sin ejercicios". */
export function progressText({
  finished,
  total,
}: RoutineAssignedProgress): string {
  if (total === 0) return 'Sin ejercicios';
  return `${finished} de ${total} ${total === 1 ? 'ejercicio' : 'ejercicios'}`;
}

/** La letra de una rutina del plan según su lugar en la semana: A, B, C... (pasada la Z, el número). */
export function routineLetter(index: number): string {
  return index < 26 ? String.fromCharCode(65 + index) : String(index + 1);
}
