import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';
import { isApiError } from '@/api/errors';
import { queryKeys } from '@/api/queryKeys';

/**
 * `POST /routine/circuit-type/set-active/{id}`: la baja lógica de un tipo de circuito (`active: false`,
 * lo que la pantalla llama "eliminar", CU-A-27) y su reactivación (`active: true`). Un tipo en uso se da
 * de baja igual: los circuitos que lo tienen lo conservan, pero deja de ofrecerse. Es solo del Admin.
 *
 * Después se piden de nuevo los tipos, los circuitos y las rutinas. Con un 404 (el tipo ya no existe)
 * se piden de nuevo los tipos.
 */
export function useSetCircuitTypeActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      api.post('/api/v1/routine/circuit-type/set-active/{id}', {
        params: { id },
        body: { active },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.routines.all });
    },
    onError: (error) => {
      if (isApiError(error) && error.status === 404) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.routines.circuitTypesAll(),
        });
      }
    },
  });
}
