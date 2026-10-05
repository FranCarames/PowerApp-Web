// Las query keys de TanStack Query, todas acá. Cada recurso tiene una raíz (`all`) de la que cuelgan
// las demás: invalidar la raíz invalida todo lo del recurso, y después de cada mutación se invalida
// lo que cambió.
export const queryKeys = {
  coaches: {
    all: ['coaches'] as const,
    list: () => [...queryKeys.coaches.all, 'list'] as const,
  },
  exercises: {
    all: ['exercises'] as const,
    list: () => [...queryKeys.exercises.all, 'list'] as const,
  },
  planifications: {
    all: ['planifications'] as const,
    list: () => [...queryKeys.planifications.all, 'list'] as const,
  },
  routines: {
    all: ['routines'] as const,
    list: () => [...queryKeys.routines.all, 'list'] as const,
    /** Los circuitos son parte de las rutinas en el backend (`/routine/circuit/*`). */
    circuits: () => [...queryKeys.routines.all, 'circuits'] as const,
  },
  memberships: {
    all: ['memberships'] as const,
    list: () => [...queryKeys.memberships.all, 'list'] as const,
    payments: (userId: string) =>
      [...queryKeys.memberships.all, 'payments', userId] as const,
    summary: () => [...queryKeys.memberships.all, 'summary'] as const,
  },
  users: {
    all: ['users'] as const,
    detail: (id: string) => [...queryKeys.users.all, 'detail', id] as const,
    /** El listado paginado de alumnos, con su búsqueda y su filtro de cuenta activa. */
    students: (filter: { keyword?: string; active?: boolean }) =>
      [...queryKeys.users.all, 'students', filter] as const,
    /** Cuántos alumnos hay con ese estado de cuenta (`active` en `undefined`: todos). */
    studentCount: (active?: boolean) =>
      [...queryKeys.users.all, 'student-count', { active }] as const,
    /** Cuántos usuarios hay en total, de cualquier rol. */
    total: () => [...queryKeys.users.all, 'total'] as const,
  },
};
