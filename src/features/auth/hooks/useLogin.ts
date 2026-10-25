import { useMutation } from '@tanstack/react-query';

import { apiRequest, readAuthToken } from '@/api/client';
import { getErrorMessage } from '@/api/errors';

import type { LoginValues } from '../schemas';
import type { Session } from '../session';

/**
 * El login salió bien pero la respuesta no trae el token en el header `Authorization`. Con el
 * backend real casi siempre es CORS: sin `Access-Control-Expose-Headers: Authorization` (C1 de
 * PLAN.md), el navegador no deja leerlo.
 */
class MissingTokenError extends Error {
  constructor() {
    super('La respuesta del login no trae el token en el header Authorization');
    this.name = 'MissingTokenError';
  }
}

/**
 * `POST /users/login`. Devuelve la sesión lista para `signIn`: el token (que llega en el header, no
 * en el body), el usuario y, si entró con la contraseña temporal, `passwordChangeRequired`. No abre la
 * sesión: eso lo decide la pantalla, porque con una contraseña temporal pasa por un modal antes.
 */
export function useLogin() {
  return useMutation({
    mutationFn: async (credentials: LoginValues): Promise<Session> => {
      const { data, response } = await apiRequest<
        'post',
        '/api/v1/users/login'
      >('post', '/api/v1/users/login', { body: credentials });
      const token = readAuthToken(response);
      if (!token) throw new MissingTokenError();

      // El login avisa siempre si se entró con la contraseña temporal (`password_change_required`).
      const { password_change_required, ...user } = data;
      return {
        token,
        user,
        ...(password_change_required && { passwordChangeRequired: true }),
      };
    },
  });
}

/**
 * El texto para el usuario cuando falla el login. Las credenciales inválidas no dicen cuál campo
 * falló (CU-U-02), y una cuenta cerrada tiene su propio mensaje.
 */
export function getLoginErrorMessage(error: unknown): string {
  if (error instanceof MissingTokenError) {
    return 'No pudimos completar el ingreso. Intentá de nuevo en unos minutos.';
  }
  return getErrorMessage(error, {
    401: 'El email o la contraseña no son correctos.',
    403: 'Tu cuenta está cerrada. Consultá en el gimnasio para volver a activarla.',
  });
}
