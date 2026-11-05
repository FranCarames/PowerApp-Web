import { useQuery } from '@tanstack/react-query';

import { api } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';

/**
 * `GET /routine/circuit-type/all`: los tipos de circuito por nombre, cada uno con cuántos circuitos
 * activos lo usan (`circuit_count`). Sin `includeInactive`, solo los activos: los que el editor de
 * circuitos ofrece (CU-E-22 y CU-E-23). Con él, también los dados de baja: la pantalla de tipos del
 * Admin (CU-A-24). Es de entrenador y admin.
 */
export function useCircuitTypes({
  includeInactive = false,
}: { includeInactive?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.routines.circuitTypes(includeInactive),
    queryFn: ({ signal }) =>
      api.get('/api/v1/routine/circuit-type/all', {
        // Sin el parámetro, el backend trae solo los activos: `false` no se manda.
        query: includeInactive ? { include_inactive: true } : undefined,
        signal,
      }),
  });
}
