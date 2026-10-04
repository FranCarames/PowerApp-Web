import { useQuery } from '@tanstack/react-query';

import { api } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';

/** Hook de prueba de la capa de API: lista los tipos de membresía (GET /membership/all, público). */
export function useMembershipsProbe() {
  return useQuery({
    queryKey: queryKeys.memberships.list(),
    queryFn: ({ signal }) => api.get('/api/v1/membership/all', { signal }),
  });
}
