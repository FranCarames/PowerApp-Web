import { passthrough } from 'msw';
import { HttpResponse } from 'msw/http';

import { mockEndpoint } from '../endpoint';
import { demoPaymentsFor } from '../fixtures/payments';
import { demoAccountForToken } from '../fixtures/users';

/** Los mocks de pagos de membresía. Cuáles están encendidos lo dice `registry.ts`. */
export const paymentMocks = [
  // Leer los pagos de un usuario es REAL: el mock atiende solo a las cuentas de demo, por su token
  // falso, y responde por cualquier alumno de demo (el entrenador y el admin miran los de los demás).
  // Con un token de verdad va al backend.
  mockEndpoint(
    'get',
    '/api/v1/membership/payment/user/{id}',
    ({ request, params }) =>
      demoAccountForToken(request.headers.get('Authorization'))
        ? HttpResponse.json(demoPaymentsFor(params.id))
        : passthrough(),
  ),
];
