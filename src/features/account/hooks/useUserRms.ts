import { useQuery } from '@tanstack/react-query';

import { request } from '@/api/client';
import type { UserRmWithExercise } from '@/api/pending';
import { queryKeys } from '@/api/queryKeys';

/**
 * `GET /user_rm/user/{id}`: los RMs registrados de un usuario, de todos sus ejercicios y sin
 * ordenar. Cada uno trae su ejercicio (`id` y `name`) en lugar de `exercise_id`: el contrato no lo
 * declara así (V10), por eso se pide con `request<T>`. El entrenador mira los de un alumno (CU-E-04)
 * y el alumno, los suyos. Con `enabled: false` no pide nada: el entrenador los ve en un modal y no
 * hace falta traerlos hasta que lo abre.
 */
export function useUserRms(userId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.userRms.byUser(userId),
    queryFn: async ({ signal }) =>
      (
        await request<UserRmWithExercise[]>(
          'get',
          `/api/v1/user_rm/user/${encodeURIComponent(userId)}`,
          { signal },
        )
      ).data,
    enabled,
  });
}
