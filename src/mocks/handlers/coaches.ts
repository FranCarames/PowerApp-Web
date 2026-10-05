import { passthrough } from 'msw';
import { HttpResponse } from 'msw/http';

import { mockEndpoint } from '../endpoint';
import { coaches } from '../fixtures/coaches';
import { demoAccountForSession } from '../fixtures/users';
import { serviceError } from '../responses';

/** Los mocks de entrenadores. Cuáles están encendidos lo dice `registry.ts`. */
export const coachMocks = [
  // El listado es REAL y público: igual que el de ejercicios, responde solo a la sesión de una cuenta
  // de demo.
  mockEndpoint('get', '/api/v1/coach/all', () =>
    demoAccountForSession() ? HttpResponse.json(coaches) : passthrough(),
  ),

  // Leer un entrenador es REAL y público: igual, responde solo a la sesión de una cuenta de demo.
  mockEndpoint('get', '/api/v1/coach/get/{id}', ({ params }) => {
    if (!demoAccountForSession()) return passthrough();
    const coach = coaches.find(({ id }) => id === params.id);
    return coach
      ? HttpResponse.json(coach)
      : serviceError(404, 'Entrenador no encontrado');
  }),
];
