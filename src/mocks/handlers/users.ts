import { passthrough } from 'msw';
import { HttpResponse } from 'msw/http';

import type { LoginResponse } from '@/api/pending';

import { mockEndpoint } from '../endpoint';
import { DEMO_PASSWORD, demoAccounts } from '../fixtures/users';
import { authTokenHeaders, serviceError } from '../responses';

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

    if (password !== DEMO_PASSWORD) {
      return serviceError(401, 'Credenciales inválidas');
    }
    if (account.closed) return serviceError(403, 'La cuenta está cerrada');

    const body: LoginResponse = {
      ...account.user,
      ...(account.passwordChangeRequired && { password_change_required: true }),
    };
    return HttpResponse.json(body, {
      headers: authTokenHeaders(`mock-token-${account.user.id}`),
    });
  }),
];
