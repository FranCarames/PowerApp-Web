import { useQueries, type UseQueryResult } from '@tanstack/react-query';

import type {
  ExerciseWithMuscles,
  MuscleGroupWithMuscles,
} from '@/api/pending';

import { exercisesQuery } from './useExercises';
import { muscleGroupsQuery } from './useMuscleGroups';

/** Un grupo muscular, como lo muestran los chips. */
export type CatalogGroup = Pick<MuscleGroupWithMuscles, 'id' | 'name'>;

/** Un ejercicio con los grupos musculares a los que pertenecen sus músculos. */
export type CatalogExercise = ExerciseWithMuscles & {
  groups: CatalogGroup[];
};

/** Cruza los ejercicios con los grupos: a qué grupos pertenece cada uno, según sus músculos. */
function crossWithGroups(
  exercises: ExerciseWithMuscles[],
  groups: MuscleGroupWithMuscles[],
) {
  const sortedGroups = [...groups].sort((a, b) =>
    a.name.localeCompare(b.name, 'es'),
  );
  const groupOfMuscle = new Map<string, CatalogGroup>();
  for (const group of sortedGroups) {
    for (const muscle of group.muscles) {
      groupOfMuscle.set(muscle.id, { id: group.id, name: group.name });
    }
  }

  return {
    groups: sortedGroups,
    exercises: exercises.map((exercise): CatalogExercise => {
      const groupsOfExercise = new Map<string, CatalogGroup>();
      for (const muscle of exercise.exercisedMuscles) {
        const group = groupOfMuscle.get(muscle.id);
        if (group) groupsOfExercise.set(group.id, group);
      }
      return { ...exercise, groups: [...groupsOfExercise.values()] };
    }),
  };
}

function combineCatalog([exercises, groups]: [
  UseQueryResult<ExerciseWithMuscles[]>,
  UseQueryResult<MuscleGroupWithMuscles[]>,
]) {
  const failed = [exercises, groups].filter((query) => query.isError);
  const catalog =
    exercises.data && groups.data
      ? crossWithGroups(exercises.data, groups.data)
      : undefined;

  return {
    exercises: catalog?.exercises,
    groups: catalog?.groups,
    isPending: !catalog && failed.length === 0,
    isError: failed.length > 0,
    error: failed[0]?.error ?? null,
    isRefetching: failed.some((query) => query.isFetching),
    /** Vuelve a pedir solo lo que falló. */
    refetch: () => failed.forEach((query) => void query.refetch()),
  };
}

/**
 * El catálogo de ejercicios cruzado con los grupos musculares: cada ejercicio con sus músculos (de
 * `GET /exercise/all`) y los grupos a los que pertenecen (de `GET /muscles/mg/all`, que trae los
 * músculos de cada grupo). Sirve para filtrar ejercicios por grupo. Lo usan el Admin (T31) y la
 * wiki del alumno (T28).
 */
export function useExerciseCatalog() {
  return useQueries({
    queries: [exercisesQuery(), muscleGroupsQuery()],
    combine: combineCatalog,
  });
}
