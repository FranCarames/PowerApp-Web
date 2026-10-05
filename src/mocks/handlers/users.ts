import { passthrough } from 'msw';
import { HttpResponse } from 'msw/http';

import type { LoginResponse } from '@/api/pending';
import type { User } from '@/api/types';

import { staffAccess } from '../access';
import { mockEndpoint } from '../endpoint';
import { coachUsers } from '../fixtures/coaches';
import { students } from '../fixtures/students';
import {
  DEMO_PASSWORD,
  demoAccountForToken,
  demoAccounts,
  demoToken,
  type DemoAccount,
} from '../fixtures/users';
import {
  authTokenHeaders,
  emptyResponse,
  guardError,
  serviceError,
} from '../responses';

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

/** Todos los usuarios que conoce el mock: las cuentas de demo que no son alumnos, los demás entrenadores y los alumnos. */
const allUsers: User[] = [
  ...demoAccounts.map(({ user }) => user).filter(({ role }) => role !== 'user'),
  ...coachUsers,
  ...students,
];

// Las bajas y reactivaciones de cuentas hechas con `POST /users/set-active/{id}` (id → active). Vive
// en memoria: al recargar la página vuelven a ser las de la fixture.
const activeOverrides = new Map<string, boolean>();

/** El usuario con su estado de cuenta al día, según las bajas y reactivaciones hechas. */
function withActive(user: User): User {
  const active = activeOverrides.get(user.id);
  return active === undefined ? user : { ...user, active };
}

/** Como el backend: coincidencia parcial, sin distinguir mayúsculas, en nombre, apellido, nombre completo y email. */
function matchesKeyword(user: User, keyword: string): boolean {
  const needle = keyword.toLowerCase();
  return [
    user.first_name,
    user.last_name,
    `${user.first_name} ${user.last_name}`,
    user.email,
  ].some((text) => text.toLowerCase().includes(needle));
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

  // Listar usuarios es REAL: el mock atiende solo a las cuentas de demo, por su token falso (el
  // backend lo rechazaría con 401). Imita al backend: filtra por rol, estado y texto, ordena del más
  // nuevo al más viejo, pagina y valida la página y el límite como el DTO.
  mockEndpoint('get', '/api/v1/users/all', ({ request }) => {
    if (!demoAccountForToken(request.headers.get('Authorization'))) {
      return passthrough();
    }

    const query = new URL(request.url).searchParams;
    const page = Number(query.get('page') ?? 1);
    const limit = Number(query.get('limit') ?? 20);
    const errors = [
      ...(Number.isInteger(page) && page >= 1
        ? []
        : ['page must not be less than 1']),
      ...(Number.isInteger(limit) && limit >= 1 && limit <= 100
        ? []
        : ['limit must not be greater than 100']),
    ];
    if (errors.length > 0) return guardError(400, errors);

    const role = query.get('role');
    const active = query.get('active');
    const keyword = query.get('keyword');
    const matching = allUsers
      .map(withActive)
      .filter((user) => !role || user.role === role)
      .filter((user) => active === null || user.active === (active === 'true'))
      .filter((user) => !keyword || matchesKeyword(user, keyword))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));

    return HttpResponse.json({
      data: matching.slice((page - 1) * limit, page * limit),
      total: matching.length,
      page,
      limit,
      totalPages: Math.ceil(matching.length / limit),
    });
  }),

  // Dar de baja o reactivar una cuenta es REAL: el mock atiende solo a las cuentas de demo, por su
  // token falso, y cambia el estado en memoria. Como el backend, no distingue roles ni se defiende de
  // que uno se dé de baja a sí mismo: 404 si el id no existe y 400 si `active` no es un booleano.
  mockEndpoint(
    'post',
    '/api/v1/users/set-active/{id}',
    async ({ request, params }) => {
      const denied = staffAccess(request);
      if (denied) return denied;

      const user = allUsers.find(({ id }) => id === params.id);
      if (!user) return serviceError(404, 'Usuario no encontrado');

      const { active } = await request.clone().json();
      if (typeof active !== 'boolean') {
        return guardError(400, ['active must be a boolean value']);
      }
      activeOverrides.set(user.id, active);
      return HttpResponse.json({
        ...withActive(user),
        updated_at: new Date().toISOString(),
      });
    },
  ),

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
