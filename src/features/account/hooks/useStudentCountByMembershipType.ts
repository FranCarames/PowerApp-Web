import { useQuery } from '@tanstack/react-query';

import { request } from '@/api/client';
import type { StudentsByMembershipType } from '@/api/pending';
import { queryKeys } from '@/api/queryKeys';

/** Cuántos alumnos tiene cada tipo de membresía, por id. Un tipo sin alumnos no figura. */
function countByType({ groups }: StudentsByMembershipType) {
  const counts = new Map<string, number>();
  for (const { membership_id, total } of groups) {
    if (membership_id !== null) counts.set(membership_id, total);
  }
  return counts;
}

/**
 * `GET /membership/type/users` (CU-E-28): los alumnos por tipo de membresía, de donde sale cuántos
 * tiene cada tipo. El tipo de un alumno es el de su último pago, y los que nunca pagaron no cuentan.
 * Es solo de entrenadores y admins. No hay un endpoint que devuelva solo los números: la respuesta
 * trae a todos los alumnos, así que se pide una vez y quien lo muestra deja pasar un fallo.
 */
export function useStudentCountByMembershipType() {
  return useQuery({
    queryKey: queryKeys.memberships.studentsByType(),
    queryFn: async ({ signal }) =>
      (
        await request<StudentsByMembershipType>(
          'get',
          '/api/v1/membership/type/users',
          { signal },
        )
      ).data,
    select: countByType,
  });
}
