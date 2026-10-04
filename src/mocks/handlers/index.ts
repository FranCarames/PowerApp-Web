import type { MockEndpoint } from '../endpoint';
import { membershipMocks } from './memberships';
import { userMocks } from './users';

/**
 * Todos los mocks que existen, de todos los dominios. Cada tarea suma los suyos en
 * `handlers/<dominio>.ts` y los agrega acá, y los enciende en `registry.ts`.
 */
export const mocks: readonly MockEndpoint[] = [
  ...membershipMocks,
  ...userMocks,
];
