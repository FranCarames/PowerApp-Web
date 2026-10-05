import { queryOptions, useQuery } from '@tanstack/react-query';

import { request } from '@/api/client';
import type { MuscleWithGroup } from '@/api/pending';
import { queryKeys } from '@/api/queryKeys';

/**
 * Las opciones de la query de `GET /muscles/all`: los músculos con su grupo. Es público. Se llama con
 * `request` porque el backend manda el grupo anidado y sin `muscle_group_id`, distinto del contrato
 * (V9).
 */
export function musclesQuery() {
  return queryOptions({
    queryKey: queryKeys.muscles.list(),
    queryFn: async ({ signal }) =>
      (
        await request<MuscleWithGroup[]>('get', '/api/v1/muscles/all', {
          auth: false,
          signal,
        })
      ).data,
  });
}

/** `GET /muscles/all`: el catálogo de músculos, cada uno con su grupo muscular (CU-A-07). */
export function useMuscles() {
  return useQuery(musclesQuery());
}
