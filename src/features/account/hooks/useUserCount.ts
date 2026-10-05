import { useQuery } from '@tanstack/react-query';

import { api } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';
import type { Role } from '@/api/types';

interface UserCountFilter {
  /** Solo los de ese rol. Sin definir: todos. */
  role?: Role;
  /** Estado de la cuenta. Sin definir: todas. */
  active?: boolean;
}

/**
 * `GET /users/all`: cuántos usuarios hay con ese rol y ese estado de cuenta. El backend informa el
 * total de lo que matchea en cada página, así que alcanza con pedir una de un solo usuario.
 */
export function useUserCount({ role, active }: UserCountFilter = {}) {
  return useQuery({
    queryKey: queryKeys.users.count({ role, active }),
    queryFn: ({ signal }) =>
      api.get('/api/v1/users/all', {
        query: { role, active, page: 1, limit: 1 },
        signal,
      }),
    select: ({ total }) => total,
  });
}
