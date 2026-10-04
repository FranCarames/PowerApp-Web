import { useMutation } from '@tanstack/react-query';

import { api } from '@/api/client';

import type { ChangePasswordValues } from '../schemas';

/**
 * `POST /users/change-password`. Sirve para el cambio voluntario y para el obligatorio tras entrar con
 * una contraseña temporal: en los dos, `current_password` es la que se usó para ingresar (el backend
 * acepta la común o la temporal). "Repetir contraseña" no viaja: el DTO rechaza campos de más.
 *
 * Una contraseña actual incorrecta es un 401 de negocio, no una sesión vencida: el cliente no cierra
 * la sesión (ver `isSessionExpiredError`) y la pantalla lo muestra en el campo.
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: ({ current_password, new_password }: ChangePasswordValues) =>
      api.post('/api/v1/users/change-password', {
        body: { current_password, new_password },
      }),
  });
}
