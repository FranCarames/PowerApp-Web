import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';

import type { CoachDataValues } from '../schemas';

/**
 * `POST /coach/promote_user` (CU-A-17): convierte a un alumno en entrenador con su email profesional y
 * su CUIL. Si ya tuvo un `Coach` (lo eliminó T35), lo reactiva y le pisa esos dos datos. Devuelve el
 * usuario ya guardado.
 *
 * Se piden de nuevo los entrenadores, los usuarios (el rol cambió, y con él los listados y los
 * contadores) y los resúmenes de membresías, que cuentan a todos los alumnos. También si falla: el
 * backend cambia el rol antes de guardar el `Coach`, así que un error puede haber dejado al usuario
 * con el rol puesto.
 */
export function useConvertToCoach() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CoachDataValues & { user_id: string }) =>
      api.post('/api/v1/coach/promote_user', { body: data }),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.coaches.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.memberships.all,
      });
    },
  });
}
