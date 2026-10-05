import { useQuery } from '@tanstack/react-query';

import { api } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';

/**
 * `GET /coach/get/{id}`: los datos profesionales de un entrenador, con el mismo id que su usuario:
 * el email profesional y el CUIL. No trae nombre ni apellido (V3): esos están en el usuario.
 */
export function useCoach(id: string) {
  return useQuery({
    queryKey: queryKeys.coaches.detail(id),
    queryFn: ({ signal }) =>
      api.get('/api/v1/coach/get/{id}', { params: { id }, signal }),
  });
}
