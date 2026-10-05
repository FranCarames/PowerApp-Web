import { passthrough } from 'msw';
import { HttpResponse } from 'msw/http';

import { mockEndpoint } from '../endpoint';
import { coaches } from '../fixtures/coaches';
import { demoAccountForSession } from '../fixtures/users';

/** Los mocks de entrenadores. Cuáles están encendidos lo dice `registry.ts`. */
export const coachMocks = [
  // El listado es REAL y público: igual que el de ejercicios, responde solo a la sesión de una cuenta
  // de demo.
  mockEndpoint('get', '/api/v1/coach/all', () =>
    demoAccountForSession() ? HttpResponse.json(coaches) : passthrough(),
  ),
];
