import { useMutation } from '@tanstack/react-query';

import { api } from '@/api/client';

import type { RecoverValues } from '../schemas';

/**
 * `POST /users/recover-password`. El backend genera una contraseña temporal y la manda por email, y
 * responde 200 con el mismo mensaje exista o no el email (CU-U-04). Esa respuesta no se muestra ni
 * se lee: la pantalla dice siempre lo mismo, así que no hay forma de saber si el email existe.
 */
export function useRecoverPassword() {
  return useMutation({
    mutationFn: ({ email }: RecoverValues) =>
      api.post('/api/v1/users/recover-password', { body: { email } }),
  });
}
