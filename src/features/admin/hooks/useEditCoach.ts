import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';

import type { CoachDataValues } from '../schemas';

/**
 * `POST /coach/promote_user` (CU-A-18): edita el email profesional y el CUIL de un entrenador. El
 * backend no tiene un endpoint de edición y no lo va a tener (aviso del 17/10): editar es volver a
 * "promover" a quien ya es entrenador, y `promote_user` le pisa esos dos datos al `Coach` que ya tiene
 * y no toca nada más. Devuelve el usuario ya guardado. El CUIL va con 11 dígitos, sin guiones.
 *
 * Después se piden de nuevo los entrenadores (el listado, el detalle y el panel) y los usuarios. También
 * si falla: `promote_user` no es transaccional (cambia el rol antes de guardar el `Coach`), así que un
 * error no asegura que no haya cambiado nada.
 */
export function useEditCoach() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CoachDataValues & { user_id: string }) =>
      api.post('/api/v1/coach/promote_user', { body: data }),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.coaches.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}
