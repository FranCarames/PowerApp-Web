import { api } from '@/api/client';

import { endSession } from './sessionStore';

/**
 * Cierra la sesión (CU-U-03). `POST /users/logout` es público y el backend solo confirma: el cierre de
 * verdad es descartar el token, que se hace acá. El request sale igual, pero no se lo espera (el
 * backend puede estar despertando) y si falla no importa: la sesión se cierra de todos modos.
 */
export function logout(): void {
  api.post('/api/v1/users/logout').catch(() => undefined);
  endSession();
}
