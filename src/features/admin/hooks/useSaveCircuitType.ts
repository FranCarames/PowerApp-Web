import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';
import { isApiError } from '@/api/errors';
import { queryKeys } from '@/api/queryKeys';
import type { CircuitType, CircuitTypeBody } from '@/api/types';

/**
 * `POST /routine/circuit-type/create` (sin `type`, CU-A-25) y `POST /routine/circuit-type/edit/{id}`
 * (con el tipo que se edita, CU-A-26). Los dos mandan el nombre y la descripción: la edición pisa los
 * dos, así que sin descripción la borra. Es solo del Admin.
 *
 * Después se piden de nuevo los tipos, los circuitos y las rutinas, que muestran el nombre del tipo.
 * Con un 404 (el tipo ya no existe) se piden de nuevo los tipos.
 */
export function useSaveCircuitType(type?: CircuitType) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CircuitTypeBody) =>
      type
        ? api.post('/api/v1/routine/circuit-type/edit/{id}', {
            params: { id: type.id },
            body,
          })
        : api.post('/api/v1/routine/circuit-type/create', { body }),
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
