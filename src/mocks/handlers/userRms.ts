import { passthrough } from 'msw';
import { HttpResponse } from 'msw/http';

import { mockEndpoint } from '../endpoint';
import { demoRmsFor } from '../fixtures/userRms';
import { demoAccountForToken } from '../fixtures/users';

/** Los mocks de los RMs de los alumnos. Cuáles están encendidos lo dice `registry.ts`. */
export const userRmMocks = [
  // Leer los RMs de un usuario es REAL: el mock atiende solo a las cuentas de demo, por su token
  // falso, y responde por cualquier alumno de demo (el entrenador mira los de los demás). Con un
  // token de verdad va al backend. Como él, no valida el id (los de demo no son UUID) y un usuario
  // sin RMs es un 200 con la lista vacía.
  mockEndpoint('get', '/api/v1/user_rm/user/{id}', ({ request, params }) =>
    demoAccountForToken(request.headers.get('Authorization'))
      ? HttpResponse.json(demoRmsFor(params.id))
      : passthrough(),
  ),
];
