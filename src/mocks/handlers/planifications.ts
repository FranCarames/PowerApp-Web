import { HttpResponse } from 'msw/http';

import { staffAccess, withoutInactive } from '../access';
import { mockEndpoint } from '../endpoint';
import { planifications } from '../fixtures/planifications';

/** Los mocks de planificaciones. Cuáles están encendidos lo dice `registry.ts`. */
export const planificationMocks = [
  // El listado es REAL: el mock atiende solo a las cuentas de demo, por su token falso.
  mockEndpoint('get', '/api/v1/planification/all', ({ request }) => {
    const denied = staffAccess(request);
    if (denied) return denied;
    return HttpResponse.json(withoutInactive(planifications, request));
  }),
];
