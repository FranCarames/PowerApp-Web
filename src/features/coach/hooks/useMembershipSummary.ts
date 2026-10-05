import { useQuery } from '@tanstack/react-query';

import { api } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';

/**
 * `GET /membership/status/summary`: cuántos alumnos hay en cada estado de membresía y la ventana de
 * "por vencer" (`expiring_soon_days`). Es solo de entrenadores y admins. Lo usan el botón de
 * Membresías de Mis alumnos y el control de membresías.
 */
export function useMembershipSummary() {
  return useQuery({
    queryKey: queryKeys.memberships.summary(),
    queryFn: ({ signal }) =>
      api.get('/api/v1/membership/status/summary', { signal }),
  });
}
