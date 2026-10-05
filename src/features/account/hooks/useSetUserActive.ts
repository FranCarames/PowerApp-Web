import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';

/**
 * `POST /users/set-active/{id}`: la baja lógica de una cuenta (`active: false`) y su reactivación
 * (`active: true`). Devuelve el usuario ya guardado. Después se piden de nuevo los listados y los
 * contadores de usuarios.
 */
export function useSetUserActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      api.post('/api/v1/users/set-active/{id}', {
        params: { id },
        body: { active },
      }),
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.users.detail(user.id), user);
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}
