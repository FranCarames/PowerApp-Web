import { useQuery } from '@tanstack/react-query';

import { api } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';

/**
 * Cuántos alumnos hay con ese estado de cuenta (`active` sin definir: todos). El backend informa el
 * total de lo que matchea en cada página, así que alcanza con pedir una de un solo alumno.
 */
export function useStudentTotal(active?: boolean) {
  return useQuery({
    queryKey: queryKeys.users.studentCount(active),
    queryFn: ({ signal }) =>
      api.get('/api/v1/users/all', {
        query: { role: 'user', active, page: 1, limit: 1 },
        signal,
      }),
    select: ({ total }) => total,
  });
}

/**
 * Los contadores de Mis alumnos: activos, inactivos y el total, que es la suma de los dos. Cada uno
 * es `undefined` mientras carga o si no se pudo cargar.
 */
export function useStudentCounts() {
  const active = useStudentTotal(true);
  const inactive = useStudentTotal(false);

  return {
    active: active.data,
    inactive: inactive.data,
    total:
      active.data !== undefined && inactive.data !== undefined
        ? active.data + inactive.data
        : undefined,
    isPending: active.isPending || inactive.isPending,
  };
}
