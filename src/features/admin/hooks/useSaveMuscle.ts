import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api, request } from '@/api/client';
import type { MuscleWithGroup } from '@/api/pending';
import { queryKeys } from '@/api/queryKeys';
import type { Muscle } from '@/api/types';

import type { MuscleValues } from '../schemas';

type OptionalField = 'description' | 'image_url' | 'preview_image';

/**
 * `POST /muscles/create` (sin `muscle`) y `POST /muscles/edit/{id}` (con el músculo que se edita).
 * Cubren CU-A-08 y CU-A-09. Los campos opcionales vacíos no se mandan: el DTO rechaza el texto vacío
 * (`IsNotEmpty`). Al editar, `editMuscle` asigna lo que viene (y lo que no viene, no lo toca), así que
 * para borrar un dato que ya tenía el front manda `null`, que el DTO deja pasar (`IsOptional`) y la
 * columna acepta: el contrato no lo declara, por eso la edición va con `request`. Después se piden de
 * nuevo los músculos y los ejercicios, que traen sus nombres.
 */
export function useSaveMuscle(muscle?: MuscleWithGroup) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: MuscleValues): Promise<Muscle> => {
      const filled = (field: OptionalField) =>
        values[field] === '' ? undefined : values[field];
      if (!muscle) {
        return api.post('/api/v1/muscles/create', {
          body: {
            muscle_group_id: values.muscle_group_id,
            name: values.name,
            description: filled('description'),
            image_url: filled('image_url'),
            preview_image: filled('preview_image'),
          },
        });
      }
      // Vacío y ya cargado: `null` borra. Vacío y sin dato: no se manda.
      const edited = (field: OptionalField) =>
        values[field] === ''
          ? muscle[field]
            ? null
            : undefined
          : values[field];
      const { data } = await request<Muscle>(
        'post',
        `/api/v1/muscles/edit/${encodeURIComponent(muscle.id)}`,
        {
          body: {
            muscle_group_id: values.muscle_group_id,
            name: values.name,
            description: edited('description'),
            image_url: edited('image_url'),
            preview_image: edited('preview_image'),
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
