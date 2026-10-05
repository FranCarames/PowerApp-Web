import { passthrough } from 'msw';
import { HttpResponse } from 'msw/http';

import { mockEndpoint } from '../endpoint';
import { demoPaymentsFor } from '../fixtures/payments';
import { demoAccounts } from '../fixtures/users';

/** Los mocks de pagos de membresía. Cuáles están encendidos lo dice `registry.ts`. */
export const paymentMocks = [
  // Leer los pagos de un usuario es REAL: el mock responde solo por los ids de las cuentas de demo.
  // Cualquier otro id va al backend.
  mockEndpoint('get', '/api/v1/membership/payment/user/{id}', ({ params }) => {
    const isDemo = demoAccounts.some(({ user }) => user.id === params.id);
    return isDemo
      ? HttpResponse.json(demoPaymentsFor(params.id))
      : passthrough();
  }),
];
