import { passthrough } from 'msw';
import { HttpResponse } from 'msw/http';

import type { LoginResponse } from '@/api/pending';

import { mockEndpoint } from '../endpoint';
import {
  DEMO_PASSWORD,
  demoAccountForToken,
  demoAccounts,
  demoToken,
  type DemoAccount,
} from '../fixtures/users';
import { authTokenHeaders, emptyResponse, serviceError } from '../responses';

// Las contraseñas que las cuentas de demo se cambiaron (id → contraseña nueva). Viven en memoria: al
// recargar la página vuelven a la de demo y la cuenta con contraseña temporal la vuelve a pedir.
const changedPasswords = new Map<string, string>();

function passwordOf({ user }: DemoAccount): string {
  return changedPasswords.get(user.id) ?? DEMO_PASSWORD;
}

/** Los mocks de Usuarios. Cuáles están encendidos lo dice `registry.ts`. */
export const userMocks = [
  // El login es REAL: el mock solo simula las cuentas de demo (entre ellas, la de la contraseña
  // temporal, que el contrato todavía no puede informar: B9). Cualquier otro email va al backend.
  mockEndpoint('post', '/api/v1/users/login', async ({ request }) => {
    const { email, password } = await request.clone().json();
    const account = demoAccounts.find(
      ({ user }) => user.email === email.trim().toLowerCase(),
    );
    if (!account) return passthrough();

    if (password !== passwordOf(account)) {
      return serviceError(401, 'Credenciales inválidas');
    }
    if (account.closed) return serviceError(403, 'La cuenta está cerrada');

    // La contraseña temporal deja de serlo cuando la cuenta se cambia la contraseña.
    const passwordChangeRequired =
      account.passwordChangeRequired && !changedPasswords.has(account.user.id);
    const body: LoginResponse = {
      ...account.user,
      ...(passwordChangeRequired && { password_change_required: true }),
    };
    return HttpResponse.json(body, {
      headers: authTokenHeaders(demoToken(account)),
    });
  }),

  // Cambiar la contraseña es REAL: el mock atiende solo a las cuentas de demo (por su token falso),
  // para poder terminar el cambio obligatorio sin backend. Con un token de verdad va al backend.
  mockEndpoint('post', '/api/v1/users/change-password', async ({ request }) => {
    const account = demoAccountForToken(request.headers.get('Authorization'));
    if (!account) return passthrough();

    const { current_password, new_password } = await request.clone().json();
    // Como el backend: una regla de negocio, con `{ error }`, y no el 401 de un guard.
    if (current_password !== passwordOf(account)) {
      return serviceError(401, 'La contraseña actual es incorrecta');
    }
    changedPasswords.set(account.user.id, new_password);
    return emptyResponse();
  }),
];
