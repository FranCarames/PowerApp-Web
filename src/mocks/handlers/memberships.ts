import { passthrough } from 'msw';
import { HttpResponse } from 'msw/http';

import { mockEndpoint } from '../endpoint';
import { memberships } from '../fixtures/memberships';
import { students } from '../fixtures/students';
import { demoAccountForToken } from '../fixtures/users';
import { guardError } from '../responses';

// Cuántos alumnos de demo hay en cada estado de membresía que no es "activa". El resto, hasta
// completar los alumnos, tiene la membresía activa.
const EXPIRING_SOON = 4;
const EXPIRED = 5;
const NO_PAYMENTS = 3;

/** Los mocks de Membresías (tipos). Cuáles están encendidos lo dice `registry.ts`. */
export const membershipMocks = [
  mockEndpoint('get', '/api/v1/membership/all', () =>
    HttpResponse.json(memberships),
  ),

  // El resumen de estados es REAL: el mock atiende solo a las cuentas de demo, por su token falso.
  // Es de entrenadores y admins: con la cuenta de un alumno responde 403, como el guard.
  mockEndpoint('get', '/api/v1/membership/status/summary', ({ request }) => {
    const account = demoAccountForToken(request.headers.get('Authorization'));
    if (!account) return passthrough();
    if (account.user.role === 'user') {
      return guardError(403, 'Acceso denegado. Permisos insuficientes.');
    }

    return HttpResponse.json({
      counts: {
        active: students.length - EXPIRING_SOON - EXPIRED - NO_PAYMENTS,
        expiring_soon: EXPIRING_SOON,
        expired: EXPIRED,
        no_payments: NO_PAYMENTS,
      },
      total_students: students.length,
      expiring_soon_days: 7,
    });
  }),
];
