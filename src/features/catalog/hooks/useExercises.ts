import { queryOptions, useQuery, useQueryClient } from '@tanstack/react-query';

import { request } from '@/api/client';
import type { ExerciseWithMuscles } from '@/api/pending';
import { queryKeys } from '@/api/queryKeys';

/**
 * Las opciones de la query de `GET /exercise/all`, para que todos la pidan igual y compartan el
 * caché. Es público: no lleva token. Se llama con `request` y no con `api` porque el backend manda
 * los músculos de cada ejercicio y el contrato no los declara (V9).
 */
export function exercisesQuery() {
  return queryOptions({
    queryKey: queryKeys.exercises.list(),
    queryFn: async ({ signal }) =>
      (
        await request<ExerciseWithMuscles[]>('get', '/api/v1/exercise/all', {
          auth: false,
          signal,
        })
      ).data,
  });
}

/** `GET /exercise/all`: el catálogo de ejercicios, cada uno con sus músculos (CU-A-01). */
export function useExercises() {
  return useQuery(exercisesQuery());
}

/**
 * `GET /exercise/{id}`: un ejercicio con sus músculos. Pide sesión (cualquier rol) y responde 404 si
 * no existe.
 *
 * Con `placeholderFromList`, mientras llega la respuesta se muestra el ejercicio que ya está en el
 * caché del listado (trae los mismos datos), así la ficha de la wiki abre al instante. No es para un
 * formulario: este dato no es el confirmado y no puede precargar campos.
 */
export function useExercise(
  id: string,
  { placeholderFromList = false }: { placeholderFromList?: boolean } = {},
) {
  const queryClient = useQueryClient();

  return useQuery<ExerciseWithMuscles>({
    queryKey: queryKeys.exercises.detail(id),
    placeholderData: () =>
      placeholderFromList
        ? queryClient
            .getQueryData(exercisesQuery().queryKey)
            ?.find((exercise) => exercise.id === id)
        : undefined,
    queryFn: async ({ signal }) =>
      (
        await request<ExerciseWithMuscles>(
          'get',
          `/api/v1/exercise/${encodeURIComponent(id)}`,
          { signal },
        )
      ).data,
  });
}
