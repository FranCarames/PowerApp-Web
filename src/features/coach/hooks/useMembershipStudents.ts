import { useQueries, type QueryObserverResult } from '@tanstack/react-query';

import type {
  MembershipStatusFilter,
  StudentMembership,
  StudentsByMembershipStatus,
} from '@/api/pending';
import {
  MEMBERSHIP_STATUSES,
  studentsByStatusQuery,
} from '@/features/account/hooks/useStudentsByMembershipStatus';

type StatusResult = QueryObserverResult<StudentsByMembershipStatus>;

/**
 * Junta lo de cada estado en una sola lista. Es todo o nada: con un estado que falló, la lista
 * quedaría sin esos alumnos y parecería completa, así que se informa el error y no se muestra nada.
 */
function combineStudents(results: StatusResult[]) {
  const failed = results.filter((result) => result.isError);
  return {
    students: results.flatMap(
      (result): StudentMembership[] => result.data?.students ?? [],
    ),
    isPending: results.some((result) => result.isPending),
    error: failed[0]?.error ?? null,
    isRefetching: results.some((result) => result.isRefetching),
    retry: () => failed.forEach((result) => void result.refetch()),
  };
}

/**
 * Los alumnos con su estado de membresía (CU-E-27), con el tipo y el vencimiento de su último pago
 * (el tipo es el de CU-E-28). Con un estado pide solo ese; con `null`, los cuatro, uno por request,
 * que es la única forma de listar a todos: no hay un endpoint con el estado de cada alumno. Es solo
 * de entrenadores y admins, y sin paginar. Comparte el caché con `useMembershipStatusByStudent`.
 */
export function useMembershipStudents(status: MembershipStatusFilter | null) {
  return useQueries({
    queries: (status ? [status] : MEMBERSHIP_STATUSES).map(
      studentsByStatusQuery,
    ),
    combine: combineStudents,
  });
}
