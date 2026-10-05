import { queryOptions, useQuery } from '@tanstack/react-query';

import { request } from '@/api/client';
import type { MuscleGroupWithMuscles } from '@/api/pending';
import { queryKeys } from '@/api/queryKeys';

/**
 * Las opciones de la query de `GET /muscles/mg/all`: los grupos musculares, cada uno con sus
 * músculos. Es público. Se llama con `request` porque el backend manda los músculos de cada grupo y
 * el contrato no los declara (V9).
 */
export function muscleGroupsQuery() {
  return queryOptions({
    queryKey: queryKeys.muscles.groups(),
    queryFn: async ({ signal }) =>
      (
        await request<MuscleGroupWithMuscles[]>(
          'get',
          '/api/v1/muscles/mg/all',
          { auth: false, signal },
        )
      ).data,
  });
}

/** `GET /muscles/mg/all`: los grupos musculares con sus músculos. */
export function useMuscleGroups() {
  return useQuery(muscleGroupsQuery());
}
