import type { UserRm } from '@/api/types';

/** Los RMs de un ejercicio, del más reciente al más antiguo. */
export interface ExerciseRms {
  exerciseId: string;
  name: string;
  rms: UserRm[];
}

const UNKNOWN_EXERCISE = 'Ejercicio sin nombre';

/** Primero el de la fecha más reciente; si es el mismo día, el cargado más tarde. */
function newestFirst(a: UserRm, b: UserRm): number {
  return (
    b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at)
  );
}

/**
 * Agrupa los RMs por ejercicio (CU-E-04 y CU-U-19). El backend los manda sueltos y sin ordenar, con
 * el id del ejercicio: el nombre sale del catálogo (`GET /exercise/all`). Los ejercicios van por
 * orden alfabético y, dentro de cada uno, del RM más reciente al más antiguo.
 */
export function groupRmsByExercise(
  rms: readonly UserRm[],
  exerciseNames: ReadonlyMap<string, string>,
): ExerciseRms[] {
  const byExercise = new Map<string, UserRm[]>();
  for (const rm of rms) {
    const group = byExercise.get(rm.exercise_id);
    if (group) group.push(rm);
    else byExercise.set(rm.exercise_id, [rm]);
  }

  return [...byExercise.entries()]
    .map(([exerciseId, group]) => ({
      exerciseId,
      name: exerciseNames.get(exerciseId) ?? UNKNOWN_EXERCISE,
      rms: group.sort(newestFirst),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
}
