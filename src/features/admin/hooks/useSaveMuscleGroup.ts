import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api, request } from '@/api/client';
import type { MuscleGroupWithMuscles } from '@/api/pending';
import { queryKeys } from '@/api/queryKeys';
import type { MuscleGroup } from '@/api/types';

import { editedValue, filledValue } from '../saveBody';
import type { MuscleGroupValues } from '../schemas';

/**
 * `POST /muscles/mg/create` (sin `group`) y `POST /muscles/mg/edit/{id}` (con el grupo que se edita).
 * Cubren CU-A-13 y CU-A-14. Los links vacíos no se mandan; al editar, vaciar uno que ya tenía manda
 * `null` (ver `saveBody.ts`), y por eso la edición va con `request`. Después se piden de nuevo los
 * músculos y los grupos, que traen el nombre del grupo.
 */
export function useSaveMuscleGroup(group?: MuscleGroupWithMuscles) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: MuscleGroupValues): Promise<MuscleGroup> => {
      if (!group) {
        return api.post('/api/v1/muscles/mg/create', {
          body: {
            name: values.name,
            image_url: filledValue(values.image_url),
            preview_image: filledValue(values.preview_image),
          },
        });
      }
      const { data } = await request<MuscleGroup>(
        'post',
        `/api/v1/muscles/mg/edit/${encodeURIComponent(group.id)}`,
        {
          body: {
            name: values.name,
            image_url: editedValue(values.image_url, group.image_url),
            preview_image: editedValue(
              values.preview_image,
              group.preview_image,
            ),
          },
        },
      );
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.muscles.all });
    },
  });
}
