import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';
import { isApiError } from '@/api/errors';
import { queryKeys } from '@/api/queryKeys';

/**
 * `DELETE /muscles/{id}` (CU-A-10): el borrado físico de un músculo. Si lo usa algún ejercicio, el
 * backend no lo borra y responde 409 (BE-24). Al borrarlo se piden de nuevo los músculos y los
 * ejercicios, de donde sale cuántos ejercicios usan cada músculo. Con el 409 se piden los ejercicios,
 * para que el próximo intento ya muestre que está en uso.
 */
export function useDeleteMuscle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      api.delete('/api/v1/muscles/{id}', { params: { id } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.muscles.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.exercises.all });
    },
    onError: (error) => {
      if (isApiError(error) && error.status === 409) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.exercises.all,
        });
      }
    },
  });
}
