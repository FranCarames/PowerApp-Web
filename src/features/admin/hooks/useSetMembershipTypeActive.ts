import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';

/**
 * `POST /membership/set-active/{id}`: la baja lógica de un tipo de membresía (`active: false`, lo que
 * la pantalla llama "eliminar", CU-A-23) y su reactivación (`active: true`). Después se pide de
 * nuevo la lista de tipos.
 */
export function useSetMembershipTypeActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      api.post('/api/v1/membership/set-active/{id}', {
        params: { id },
        body: { active },
      }),
    onSuccess: () => {
      // Los alumnos por tipo y los pagos no cambian: solo se pide de nuevo la lista de tipos.
      void queryClient.invalidateQueries({
        queryKey: queryKeys.memberships.list(),
      });
    },
  });
}
