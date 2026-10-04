import { configureApi } from '@/api/client';
import {
  getErrorMessage,
  isAccountDisabledError,
  isSessionExpiredError,
} from '@/api/errors';
import { endSession, getSession } from '@/features/auth/sessionStore';

/**
 * Conecta el cliente de la API con la sesión, antes del primer render: el token sale de la sesión
 * actual y la sesión se cierra cuando el backend dice que murió. Eso es un 401 de guard en un
 * request con token y un 403 de cuenta deshabilitada; el 403 de permisos insuficientes no la cierra,
 * ni un 401 de negocio (la contraseña actual incorrecta). Cerrarla alcanza para que los guards lleven
 * a /login, y el aviso lo muestra <AuthProvider>.
 */
export function connectApiToSession(): void {
  configureApi({
    getToken: () => getSession()?.token ?? null,
    onUnauthorized: (error) => {
      if (isSessionExpiredError(error)) endSession(getErrorMessage(error));
    },
    onForbidden: (error) => {
      if (!isAccountDisabledError(error)) return;
      endSession(
        getErrorMessage(error, {
          403: 'Tu cuenta está deshabilitada. Consultá con tu gimnasio.',
        }),
      );
    },
  });
}
