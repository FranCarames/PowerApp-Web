// Las query keys de TanStack Query, todas acá. Cada recurso tiene una raíz (`all`) de la que cuelgan
// las demás: invalidar la raíz invalida todo lo del recurso, y después de cada mutación se invalida
// lo que cambió.
export const queryKeys = {
  coaches: {
    all: ['coaches'] as const,
    list: () => [...queryKeys.coaches.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.coaches.all, 'detail', id] as const,
  },
  exercises: {
    all: ['exercises'] as const,
    list: () => [...queryKeys.exercises.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.exercises.all, 'detail', id] as const,
  },
  muscles: {
    all: ['muscles'] as const,
    list: () => [...queryKeys.muscles.all, 'list'] as const,
    /** Los grupos musculares, cada uno con sus músculos. */
    groups: () => [...queryKeys.muscles.all, 'groups'] as const,
  },
  planifications: {
    all: ['planifications'] as const,
    list: () => [...queryKeys.planifications.all, 'list'] as const,
    /** La planificación vigente de un alumno. */
    userActive: (userId: string) =>
      [...queryKeys.planifications.all, 'user-active', userId] as const,
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
    /** Los alumnos cuya membresía está en ese estado. */
    studentsByStatus: (status: string) =>
      [...queryKeys.memberships.all, 'students-by-status', status] as const,
  },
  users: {
    all: ['users'] as const,
    detail: (id: string) => [...queryKeys.users.all, 'detail', id] as const,
    /** El listado paginado de usuarios, con su rol, su búsqueda y su estado de cuenta. */
    list: (filter: { role?: string; keyword?: string; active?: boolean }) =>
      [...queryKeys.users.all, 'list', filter] as const,
    /** Cuántos usuarios hay con ese rol y ese estado de cuenta. */
    count: (filter: { role?: string; active?: boolean }) =>
      [...queryKeys.users.all, 'count', filter] as const,
  },
};
