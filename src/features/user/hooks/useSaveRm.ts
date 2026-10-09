import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';
import type { UserRmWithExercise } from '@/api/pending';

import type { RmValues } from '../schemas';

/**
 * `POST /user_rm/create` (sin `rm`, CU-U-17) y `POST /user_rm/edit/{id}` (con el RM que se edita,
 * CU-U-18). Los dos piden el `user_id` y el backend lo compara con el de la sesión: es el del propio
 * usuario. Después se piden de nuevo los RMs, también si falló: un 404 quiere decir que la lista estaba
 * vieja.
 *
 * La fecha viaja con el mediodía (`2026-10-06T12:00:00`, sin zona) y no pelada (`2026-10-06`): el
 * backend la lee con `new Date(date)` y toma el día con la zona horaria de su servidor. Un día pelado
 * es la medianoche UTC y en un servidor al oeste de UTC (el de Fran, en local) caería un día antes, y
 * cada edición lo correría otro más. El mediodía cae en el mismo día en cualquier servidor.
 */
export function useSaveRm(userId: string, rm?: UserRmWithExercise) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: RmValues) => {
      const body = {
        user_id: userId,
        ...values,
        date: `${values.date}T12:00:00`,
      };
      return rm
        ? api.post('/api/v1/user_rm/edit/{id}', {
            params: { id: rm.id },
            body,
          })
        : api.post('/api/v1/user_rm/create', { body });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.userRms.all });
    },
  });
}
