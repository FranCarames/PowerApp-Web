import { useQuery } from '@tanstack/react-query';

import { api } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';

/**
 * `GET /user_rm/user/{id}`: los RMs registrados de un usuario, de todos sus ejercicios y sin ordenar.
 * El entrenador mira los de un alumno (CU-E-04) y el alumno, los suyos. Con `enabled: false` no pide
 * nada: el entrenador los ve en un modal y no hace falta traerlos hasta que lo abre.
 */
export function useUserRms(userId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.userRms.byUser(userId),
    queryFn: ({ signal }) =>
      api.get('/api/v1/user_rm/user/{id}', {
        params: { id: userId },
        signal,
      }),
    enabled,
  });
}
