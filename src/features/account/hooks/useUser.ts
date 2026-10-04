import { useQuery } from '@tanstack/react-query';

import { api } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';

/** `GET /users/get/{id}`: los datos de un usuario. Mi cuenta lo usa con el id de la sesión. */
export function useUser(id: string) {
  return useQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn: ({ signal }) =>
      api.get('/api/v1/users/get/{id}', { params: { id }, signal }),
  });
}
