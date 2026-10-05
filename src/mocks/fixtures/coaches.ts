import type { Coach, User } from '@/api/types';

import { demoAccounts } from './users';

// Los entrenadores de demo: el de la cuenta de demo (Diego, con su mismo id) y tres más, uno de ellos
// con la cuenta inactiva. El backend devuelve solo la entidad Coach, sin nombre ni apellido (V3): los
// de los otros tres están en `coachUsers`, sus usuarios. El CUIL va con 11 dígitos, sin guiones.
const TIMESTAMP = '2026-02-01T12:00:00.000Z';

const demoCoach = demoAccounts.find(({ user }) => user.role === 'coach');

function coach(
  id: string,
  coach_email: string,
  cuil: string,
  active = true,
): Coach {
  return {
    id,
    coach_email,
    cuil,
    active,
    created_at: TIMESTAMP,
    updated_at: TIMESTAMP,
  };
}

export const coaches: Coach[] = [
  coach(demoCoach?.user.id ?? 'demo-coach-1', 'diego@gym.com', '20301112224'),
  coach('demo-coach-2', 'carla@gym.com', '27312223335'),
  coach('demo-coach-3', 'martin@gym.com', '20323334446'),
  coach('demo-coach-4', 'andrea@gym.com', '27334445557', false),
];

function coachUser(
  index: number,
  first_name: string,
  last_name: string,
  email: string,
  active = true,
): User {
  return {
    id: coaches[index].id,
    first_name,
    last_name,
    email,
    email_verified: true,
    role: 'coach',
    phone_verified: false,
    active,
    created_at: TIMESTAMP,
    updated_at: TIMESTAMP,
  };
}

/** Los usuarios de los entrenadores que no tienen cuenta de demo, con el mismo id que su `Coach`. */
export const coachUsers: User[] = [
  coachUser(1, 'Carla', 'Giménez', 'carla.gimenez@email.com'),
  coachUser(2, 'Martín', 'López', 'martin.lopez@email.com'),
  coachUser(3, 'Andrea', 'Ruiz', 'andrea.ruiz@email.com', false),
];
