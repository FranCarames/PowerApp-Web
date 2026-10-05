import type { MockEndpoint } from '../endpoint';
import { coachMocks } from './coaches';
import { exerciseMocks } from './exercises';
import { membershipMocks } from './memberships';
import { paymentMocks } from './payments';
import { planificationMocks } from './planifications';
import { routineMocks } from './routines';
import { userMocks } from './users';

/**
 * Todos los mocks que existen, de todos los dominios. Cada tarea suma los suyos en
 * `handlers/<dominio>.ts` y los agrega acá, y los enciende en `registry.ts`.
 */
export const mocks: readonly MockEndpoint[] = [
  ...coachMocks,
  ...exerciseMocks,
  ...membershipMocks,
  ...paymentMocks,
  ...planificationMocks,
  ...routineMocks,
  ...userMocks,
];
