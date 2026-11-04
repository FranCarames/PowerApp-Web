import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';
import { isApiError } from '@/api/errors';
import { queryKeys } from '@/api/queryKeys';

/**
 * `DELETE /muscles/mg/{id}` (CU-A-15): el borrado físico de un grupo muscular. Si todavía tiene
 * músculos, el backend no lo borra y responde 409 (BE-25). Después de borrarlo, y también con el 409
 * (para que el contador muestre los músculos que tiene), se piden de nuevo los grupos y los músculos.
 */
export function useDeleteMuscleGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      api.delete('/api/v1/muscles/mg/{id}', { params: { id } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.muscles.all });
    },
    onError: (error) => {
      if (isApiError(error) && error.status === 409) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.muscles.all });
      }
    },
  });
}
