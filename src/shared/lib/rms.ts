import type { UserRmWithExercise } from '@/api/pending';

/** Los RMs de un ejercicio, del más reciente al más antiguo. */
export interface ExerciseRms {
  exerciseId: string;
  name: string;
  rms: UserRmWithExercise[];
}

/** Primero el de la fecha más reciente; si es el mismo día, el cargado más tarde. */
function newestFirst(a: UserRmWithExercise, b: UserRmWithExercise): number {
  return (
    b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at)
  );
}

/**
 * Agrupa los RMs por ejercicio (CU-E-04 y CU-U-19). El backend los manda sueltos y sin ordenar, cada
 * uno con su ejercicio (`id` y `name`). Los ejercicios van por orden alfabético y, dentro de cada
 * uno, del RM más reciente al más antiguo.
 */
export function groupRmsByExercise(
  rms: readonly UserRmWithExercise[],
): ExerciseRms[] {
  const byExercise = new Map<string, ExerciseRms>();
  for (const rm of rms) {
    const group = byExercise.get(rm.exercise.id);
    if (group) group.rms.push(rm);
    else
      byExercise.set(rm.exercise.id, {
        exerciseId: rm.exercise.id,
        name: rm.exercise.name,
        rms: [rm],
      });
  }

  return [...byExercise.values()]
    .map((group) => ({ ...group, rms: group.rms.sort(newestFirst) }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
}
