import type { CatalogExercise } from './hooks/useExerciseCatalog';

/** Cuántos "otros ejercicios del grupo" muestra la página del músculo antes de "Ver todos" (D84). */
export const OTHER_EXERCISES_LIMIT = 6;

export interface MuscleExercises {
  /** Los ejercicios que tienen asignado el músculo. */
  working: CatalogExercise[];
  /** Los que trabajan otro músculo del mismo grupo y no este. */
  others: CatalogExercise[];
}

const byName = (a: CatalogExercise, b: CatalogExercise) =>
  a.name.localeCompare(b.name, 'es');

/**
 * Reparte el catálogo según un músculo: los ejercicios que lo trabajan y los otros de su grupo
 * muscular, cada lista en orden alfabético. Un ejercicio que trabaja el músculo no se repite en
 * `others`, aunque trabaje además otro músculo del grupo.
 */
export function exercisesOfMuscle(
  exercises: readonly CatalogExercise[],
  muscleId: string,
  groupId: string,
): MuscleExercises {
  const working: CatalogExercise[] = [];
  const others: CatalogExercise[] = [];

  for (const exercise of exercises) {
    if (exercise.exercisedMuscles.some(({ id }) => id === muscleId)) {
      working.push(exercise);
    } else if (exercise.groups.some(({ id }) => id === groupId)) {
      others.push(exercise);
    }
  }

  return { working: working.sort(byName), others: others.sort(byName) };
}
