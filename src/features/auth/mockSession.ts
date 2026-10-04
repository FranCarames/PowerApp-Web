import type { Role, User } from '@/api/types';

import type { Session } from './session';

// TEMPORAL (T09): usuarios de prueba para entrar sin el login real. Los nombres son los del prototipo.
const TIMESTAMP = '2026-01-01T00:00:00.000Z';

const MOCK_USERS: Record<Role, User> = {
  user: {
    id: 'mock-user',
    first_name: 'Franco',
    last_name: 'Carames',
    email: 'franco@email.com',
    email_verified: true,
    role: 'user',
    phone_verified: false,
    active: true,
    created_at: TIMESTAMP,
    updated_at: TIMESTAMP,
  },
  coach: {
    id: 'mock-coach',
    first_name: 'Diego',
    last_name: 'Fernández',
    email: 'diego@gym.com',
    email_verified: true,
    role: 'coach',
    phone_verified: false,
    active: true,
    created_at: TIMESTAMP,
    updated_at: TIMESTAMP,
  },
  admin: {
    id: 'mock-admin',
    first_name: 'Administrador',
    last_name: '',
    email: 'admin@powerapp.com',
    email_verified: true,
    role: 'admin',
    phone_verified: false,
    active: true,
    created_at: TIMESTAMP,
    updated_at: TIMESTAMP,
  },
};

export function mockSession(role: Role): Session {
  return { token: 'mock-token', user: MOCK_USERS[role] };
}
