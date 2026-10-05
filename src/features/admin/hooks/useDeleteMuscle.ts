import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';

/**
 * `DELETE /muscles/{id}` (CU-A-10): el borrado físico de un músculo. Después se piden de nuevo los
 * músculos y los ejercicios: el backend quita el músculo de los ejercicios que lo usaban.
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
  });
}
