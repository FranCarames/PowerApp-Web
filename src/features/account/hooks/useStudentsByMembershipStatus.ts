import { useQueries, useQuery } from '@tanstack/react-query';

import { request } from '@/api/client';
import type {
  MembershipStatusFilter,
  StudentsByMembershipStatus,
} from '@/api/pending';
import { queryKeys } from '@/api/queryKeys';
import type { MembershipStatus } from '@/shared/lib/membershipStatus';

/** Los cuatro estados de membresía, en el orden del contrato. */
export const MEMBERSHIP_STATUSES: readonly MembershipStatusFilter[] = [
  'active',
  'expiring_soon',
  'expired',
  'no_payments',
];

/** La query de `GET /membership/status/users?status=…`, para quien combina varios estados. */
export function studentsByStatusQuery(status: MembershipStatusFilter) {
  return {
    queryKey: queryKeys.memberships.studentsByStatus(status),
    queryFn: async ({ signal }: { signal: AbortSignal }) =>
      (
        await request<StudentsByMembershipStatus>(
          'get',
          '/api/v1/membership/status/users',
          { query: { status }, signal },
        )
      ).data,
  };
}

/**
 * `GET /membership/status/users?status=…`: los alumnos con ese estado de membresía (CU-E-27). Es solo
 * de entrenadores y admins. Devuelve a todos, sin paginar.
 */
export function useStudentsByMembershipStatus(status: MembershipStatusFilter) {
  return useQuery(studentsByStatusQuery(status));
}

/** Para cada alumno, su estado de membresía. Un alumno que todavía no llegó no figura. */
function combineStatuses(
  results: Array<{ data?: StudentsByMembershipStatus }>,
): ReadonlyMap<string, MembershipStatus> {
  const byStudent = new Map<string, MembershipStatus>();
  for (const { data } of results) {
    for (const student of data?.students ?? []) {
      byStudent.set(student.id, student.membership_status);
    }
  }
  return byStudent;
}

/**
 * El estado de membresía de todos los alumnos, en un mapa por id. No hay un endpoint por alumno:
 * son cuatro requests en total, uno por estado, sin importar cuántos alumnos haya. Si alguno falla,
 * faltan los alumnos de ese estado y quien lo muestra lo deja pasar.
 */
export function useMembershipStatusByStudent() {
  return useQueries({
    queries: MEMBERSHIP_STATUSES.map(studentsByStatusQuery),
    combine: combineStatuses,
  });
}
