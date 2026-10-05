import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';

import type { ExerciseValues } from '../schemas';

/**
 * El body de alta y edición de un ejercicio. Los campos de texto vacíos no se mandan: el DTO
 * rechaza el texto vacío (`IsNotEmpty`) y, sin el campo, el backend conserva lo guardado.
 */
function toBody(values: ExerciseValues) {
  const text = (value: string) => (value === '' ? undefined : value);
  return {
    name: values.name,
    description: values.description,
    exercised_muscles_ids: values.exercised_muscles_ids,
    safety_tips: text(values.safety_tips),
    activation_tips: text(values.activation_tips),
    video_url: text(values.video_url),
    preview_image: text(values.preview_image),
    bg_image: text(values.bg_image),
  };
}

/**
 * `POST /exercise/create` (sin `id`) y `POST /exercise/edit/{id}` (con `id`). Cubren CU-A-04 y CU-A-05,
 * y también CU-A-02 y CU-A-03: los músculos van en `exercised_muscles_ids`, la lista completa, y el
 * backend agrega los que faltan y quita los que sobran. Después se piden de nuevo los ejercicios y
 * los circuitos, que muestran sus nombres.
 */
export function useSaveExercise(id?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: ExerciseValues) =>
      id === undefined
        ? api.post('/api/v1/exercise/create', { body: toBody(values) })
        : api.post('/api/v1/exercise/edit/{id}', {
            params: { id },
            body: toBody(values),
          }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.exercises.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.routines.all });
    },
  });
}
