import { passthrough } from 'msw';
import { HttpResponse } from 'msw/http';

import { mockEndpoint } from '../endpoint';
import { muscleGroups } from '../fixtures/muscles';
import { demoAccountForSession } from '../fixtures/users';

/** Los mocks de músculos y grupos musculares. Cuáles están encendidos lo dice `registry.ts`. */
export const muscleMocks = [
  // El listado de grupos es REAL y público: responde solo a la sesión de una cuenta de demo. Cada grupo
  // trae sus músculos, aunque el contrato no lo declare (V9).
  mockEndpoint('get', '/api/v1/muscles/mg/all', () =>
    demoAccountForSession() ? HttpResponse.json(muscleGroups) : passthrough(),
  ),
];
