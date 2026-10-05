import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';

/**
 * Las opciones de la query de `GET /membership/all`: todos los tipos de membresía, también los dados
 * de baja (`active: false`), sin filtro. Es público. La pantalla del Admin los muestra todos; quien
 * registra un pago (T18) tiene que ofrecer solo los activos: el backend no lo valida.
 */
export function membershipTypesQuery() {
  return queryOptions({
    queryKey: queryKeys.memberships.list(),
    queryFn: ({ signal }) => api.get('/api/v1/membership/all', { signal }),
  });
}

/** `GET /membership/all`: los tipos de membresía (CU-A-20). */
export function useMembershipTypes() {
  return useQuery(membershipTypesQuery());
}
