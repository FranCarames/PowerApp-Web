import { passthrough } from 'msw';
import { HttpResponse } from 'msw/http';

import { mockEndpoint } from '../endpoint';
import { exercises } from '../fixtures/exercises';
import { demoAccountForSession } from '../fixtures/users';

/** Los mocks de ejercicios. Cuáles están encendidos lo dice `registry.ts`. */
export const exerciseMocks = [
  // El listado es REAL y público: no lleva token, así que el mock mira la sesión y responde solo si
  // es la de una cuenta de demo. Con una cuenta de verdad, va al backend.
  mockEndpoint('get', '/api/v1/exercise/all', () =>
    demoAccountForSession() ? HttpResponse.json(exercises) : passthrough(),
  ),
];
