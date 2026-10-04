import type { User } from '@/api/types';

// Cuentas de demo del login mockeado. Con los mocks encendidos, el login responde estas y deja pasar
// al backend real cualquier otro email: ahí entran las cuentas de verdad. Los nombres son los del
// prototipo.
//
// Su token es falso (el handler lo arma), así que sirven para recorrer las pantallas con datos
// mockeados, no para llamar a endpoints reales: el backend los rechaza con 401 y el cliente cierra
// la sesión. Cambiar la contraseña es la excepción: también la mockea (`handlers/users.ts`).

/** La contraseña de todas las cuentas de demo (cumple las reglas de `LoginUserDto`: 6 a 50). */
export const DEMO_PASSWORD = 'demo123';

export interface DemoAccount {
  user: User;
  /** Entra con una contraseña temporal (B9): el login avisa que tiene que cambiarla. */
  passwordChangeRequired?: true;
  /** Cuenta cerrada: el login responde 403 aunque la contraseña sea correcta. */
  closed?: true;
}

/** El token de las cuentas de demo empieza así: ningún JWT de verdad lo hace. */
const DEMO_TOKEN_PREFIX = 'mock-token-';

export function demoToken({ user }: DemoAccount): string {
  return `${DEMO_TOKEN_PREFIX}${user.id}`;
}

/** La cuenta de demo a la que pertenece el token (el valor del header `Authorization`), si lo es. */
export function demoAccountForToken(
  authorization: string | null,
): DemoAccount | undefined {
  const token = authorization?.replace(/^Bearer\s+/i, '').trim();
  return demoAccounts.find((account) => demoToken(account) === token);
}

const TIMESTAMP = '2026-01-01T00:00:00.000Z';

function demoUser(
  id: string,
  role: User['role'],
  first_name: string,
  last_name: string,
  email: string,
  active = true,
): User {
  return {
    id,
    first_name,
    last_name,
    email,
    email_verified: true,
    role,
    phone_verified: false,
    active,
    created_at: TIMESTAMP,
    updated_at: TIMESTAMP,
  };
}

export const demoAccounts: DemoAccount[] = [
  {
    user: demoUser(
      '5c1f0d7e-3a52-4e0b-9d44-1b6a8f2c7a01',
      'user',
      'Franco',
      'Carames',
      'franco@email.com',
    ),
  },
  {
    user: demoUser(
      '8e2a6b14-9f3c-4d71-a5c8-3d0e7b9f4c02',
      'coach',
      'Diego',
      'Fernández',
      'diego@gym.com',
    ),
  },
  {
    user: demoUser(
      'a7d94c30-1e6b-4f28-8b53-6c2f9a1d0e03',
      'admin',
      'Administrador',
      '',
      'admin@powerapp.com',
    ),
  },
  {
    user: demoUser(
      '3b8f5e92-7c14-4a60-b2d9-0f4e1c8a6d04',
      'user',
      'Lucía',
      'Gómez',
      'lucia@email.com',
    ),
    passwordChangeRequired: true,
  },
  {
    user: demoUser(
      'd19c7a45-2b80-4e36-9f17-5a3c0b8e2f05',
      'user',
      'Martín',
      'Pérez',
      'martin@email.com',
      false,
    ),
    closed: true,
  },
];
