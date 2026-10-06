import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api, request } from '@/api/client';
import type { MuscleWithGroup } from '@/api/pending';
import { queryKeys } from '@/api/queryKeys';
import type { Muscle } from '@/api/types';

import { editedValue, filledValue } from '../saveBody';
import type { MuscleValues } from '../schemas';

/**
 * `POST /muscles/create` (sin `muscle`) y `POST /muscles/edit/{id}` (con el músculo que se edita).
 * Cubren CU-A-08 y CU-A-09. Los campos opcionales vacíos no se mandan; al editar, vaciar un dato que
 * ya tenía manda `null` (ver `saveBody.ts`), y por eso la edición va con `request`. Después se piden
 * de nuevo los músculos y los ejercicios, que traen sus nombres.
 */
export function useSaveMuscle(muscle?: MuscleWithGroup) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: MuscleValues): Promise<Muscle> => {
      if (!muscle) {
        return api.post('/api/v1/muscles/create', {
          body: {
            muscle_group_id: values.muscle_group_id,
            name: values.name,
            description: filledValue(values.description),
            image_url: filledValue(values.image_url),
            preview_image: filledValue(values.preview_image),
          },
        });
      }
      const { data } = await request<Muscle>(
        'post',
        `/api/v1/muscles/edit/${encodeURIComponent(muscle.id)}`,
        {
          body: {
            muscle_group_id: values.muscle_group_id,
            name: values.name,
            description: editedValue(values.description, muscle.description),
            image_url: editedValue(values.image_url, muscle.image_url),
            preview_image: editedValue(
              values.preview_image,
              muscle.preview_image,
            ),
          },
        },
      );
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.muscles.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.exercises.all });
    },
  });
}
