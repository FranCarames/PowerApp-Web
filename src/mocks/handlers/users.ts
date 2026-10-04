import { passthrough } from 'msw';
import { HttpResponse } from 'msw/http';

import type { LoginResponse } from '@/api/pending';
import type { User } from '@/api/types';

import { mockEndpoint } from '../endpoint';
import {
  DEMO_PASSWORD,
  demoAccountForToken,
  demoAccounts,
  demoToken,
  type DemoAccount,
} from '../fixtures/users';
import { authTokenHeaders, emptyResponse, serviceError } from '../responses';

// Lo que las cuentas de demo se cambiaron: la contraseña (id → contraseña nueva) y los datos
// personales (id → usuario editado). Vive en memoria: al recargar la página vuelven a ser los de la
// fixture, y la cuenta con contraseña temporal la vuelve a pedir.
const changedPasswords = new Map<string, string>();
const editedUsers = new Map<string, User>();

function passwordOf({ user }: DemoAccount): string {
  return changedPasswords.get(user.id) ?? DEMO_PASSWORD;
}

function userOf(account: DemoAccount): User {
  return editedUsers.get(account.user.id) ?? account.user;
}

/** Los mocks de Usuarios. Cuáles están encendidos lo dice `registry.ts`. */
export const userMocks = [
  // El login es REAL: el mock solo simula las cuentas de demo (entre ellas, la de la contraseña
  // temporal, que el contrato todavía no puede informar: B9). Cualquier otro email va al backend.
  mockEndpoint('post', '/api/v1/users/login', async ({ request }) => {
    const { email, password } = await request.clone().json();
    const account = demoAccounts.find(
      (candidate) => userOf(candidate).email === email.trim().toLowerCase(),
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
      ...userOf(account),
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

  // Leer un usuario es REAL: el mock responde solo por los ids de las cuentas de demo (con los datos
  // que se hayan editado). Cualquier otro id va al backend.
  mockEndpoint('get', '/api/v1/users/get/{id}', ({ params }) => {
    const account = demoAccounts.find(({ user }) => user.id === params.id);
    return account ? HttpResponse.json(userOf(account)) : passthrough();
  }),

  // Editar los datos personales es REAL: el mock atiende solo a las cuentas de demo, por su token.
  // Imita al backend: guarda solo lo que viene, devuelve el usuario, responde 409 si el email lo usa
  // otra cuenta y pierde la verificación del email y del teléfono cuando cambian.
  mockEndpoint('post', '/api/v1/users/edit', async ({ request }) => {
    const account = demoAccountForToken(request.headers.get('Authorization'));
    if (!account) return passthrough();

    const changes = await request.clone().json();
    const current = userOf(account);
    const email = changes.email?.toLowerCase();
    if (
      email !== undefined &&
      email !== current.email &&
      demoAccounts.some((other) => userOf(other).email === email)
    ) {
      return serviceError(409, 'Ya existe un usuario con ese email');
    }

    const edited: User = {
      ...current,
      ...changes,
      ...(email !== undefined && { email }),
      email_verified: email === undefined || email === current.email,
      phone_verified:
        current.phone_verified &&
        (changes.phone_prefix ?? current.phone_prefix) ===
          current.phone_prefix &&
        (changes.phone_number ?? current.phone_number) === current.phone_number,
      updated_at: new Date().toISOString(),
    };
    editedUsers.set(account.user.id, edited);
    return HttpResponse.json(edited);
  }),
];
