import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';

/**
 * `DELETE /exercise/{id}` (CU-A-06): el borrado físico de un ejercicio. El backend lo rechaza si hay
 * RMs o entrenamientos hechos con él (V7). Después se piden de nuevo los ejercicios y los circuitos.
 */
export function useDeleteExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      api.delete('/api/v1/exercise/{id}', { params: { id } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.exercises.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.routines.all });
    },
  });
}
