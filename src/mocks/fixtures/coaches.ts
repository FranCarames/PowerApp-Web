import type { Coach } from '@/api/types';

import { demoAccounts } from './users';

// Los entrenadores de demo: el de la cuenta de demo (Diego, con su mismo id) y tres más, uno de ellos
// con la cuenta inactiva. El backend devuelve solo la entidad Coach: sin nombre ni apellido (V3).
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
  coach(demoCoach?.user.id ?? 'demo-coach-1', 'diego@gym.com', '20-30111222-4'),
  coach('demo-coach-2', 'carla@gym.com', '27-31222333-5'),
  coach('demo-coach-3', 'martin.lopez@gym.com', '20-32333444-6'),
  coach('demo-coach-4', 'andrea@gym.com', '27-33444555-7', false),
];
