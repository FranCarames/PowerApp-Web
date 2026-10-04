import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';
import { useAuth } from '@/features/auth/hooks/useAuth';

import type { ProfileValues } from '../schemas';

/**
 * `POST /users/edit`: edita el propio usuario (el backend toma el id del token) y devuelve el usuario
 * ya guardado, con el que se actualiza el de la sesión. La foto es opcional: vacía no se manda, porque
 * el backend la valida como URL y no hay forma de borrarla desde este DTO.
 */
export function useEditProfile() {
  const { updateUser } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ profile_picture, ...values }: ProfileValues) =>
      api.post('/api/v1/users/edit', {
        body: { ...values, ...(profile_picture !== '' && { profile_picture }) },
      }),
    onSuccess: (user) => {
      updateUser(user);
      // El caché queda con lo que se guardó, para que Datos personales no muestre lo anterior al
      // volver a abrirse, y lo demás de usuarios se pide de nuevo (sin esperarlo) cuando haga falta.
      queryClient.setQueryData(queryKeys.users.detail(user.id), user);
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}
