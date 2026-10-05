import { HttpResponse } from 'msw/http';

import { staffAccess, withoutInactive } from '../access';
import { mockEndpoint } from '../endpoint';
import { circuits } from '../fixtures/circuits';
import { routines } from '../fixtures/routines';

// Por ahora los listados sin filtros: `keyword` y `type` los suman las tareas de circuitos y rutinas.

/** Los mocks de circuitos y rutinas. Cuáles están encendidos lo dice `registry.ts`. */
export const routineMocks = [
  // Los circuitos son REAL: el mock atiende solo a las cuentas de demo, por su token falso.
  mockEndpoint('get', '/api/v1/routine/circuit/all', ({ request }) => {
    const denied = staffAccess(request);
    if (denied) return denied;
    return HttpResponse.json(withoutInactive(circuits, request));
  }),

  mockEndpoint('get', '/api/v1/routine/all', ({ request }) => {
    const denied = staffAccess(request);
    if (denied) return denied;
    return HttpResponse.json(withoutInactive(routines, request));
  }),
];
