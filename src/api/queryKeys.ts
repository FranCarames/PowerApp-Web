// Las query keys de TanStack Query, todas acá. Cada recurso tiene una raíz (`all`) de la que cuelgan
// las demás: invalidar la raíz invalida todo lo del recurso, y después de cada mutación se invalida
// lo que cambió.
export const queryKeys = {
  memberships: {
    all: ['memberships'] as const,
    list: () => [...queryKeys.memberships.all, 'list'] as const,
  },
  users: {
    all: ['users'] as const,
    detail: (id: string) => [...queryKeys.users.all, 'detail', id] as const,
  },
};
