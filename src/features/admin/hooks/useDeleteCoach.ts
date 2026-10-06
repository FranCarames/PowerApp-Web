import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';

/**
 * `POST /coach/delete_coach/{id}` (CU-A-19): la baja de un entrenador. Es una baja lógica del registro
 * de Coach (`active: false`) y además le devuelve a su usuario el rol `user`: deja de ser entrenador y
 * vuelve a ser alumno, con la cuenta y los datos intactos. Devuelve el usuario ya guardado.
 *
 * Se piden de nuevo los entrenadores y los usuarios (el rol cambió, y con él los listados y los
 * contadores) y los resúmenes de membresías, que cuentan a todos los alumnos. También si falla: un 404
 * dice que la lista estaba vieja.
 */
export function useDeleteCoach() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      api.post('/api/v1/coach/delete_coach/{id}', { params: { id } }),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.coaches.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.memberships.all,
      });
    },
  });
}
