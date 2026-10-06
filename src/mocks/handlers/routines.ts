import { HttpResponse } from 'msw/http';

import { staffAccess, withoutInactive } from '../access';
import { mockEndpoint } from '../endpoint';
import { circuits, circuitsPlus } from '../fixtures/circuits';
import { routines, routinesPlus } from '../fixtures/routines';

// Los listados sin los filtros `keyword` y `type`: la pantalla de circuitos busca en el front.

/** Los mocks de circuitos y rutinas. Cuáles están encendidos lo dice `registry.ts`. */
export const routineMocks = [
  // Los circuitos son REAL: el mock atiende solo a las cuentas de demo, por su token falso.
  mockEndpoint('get', '/api/v1/routine/circuit/all', ({ request }) => {
    const denied = staffAccess(request);
    if (denied) return denied;
    return HttpResponse.json(withoutInactive(circuits, request));
  }),

  // Los mismos circuitos con sus ejercicios (`all-plus`).
  mockEndpoint('get', '/api/v1/routine/circuit/all-plus', ({ request }) => {
    const denied = staffAccess(request);
    if (denied) return denied;
    return HttpResponse.json(withoutInactive(circuitsPlus, request));
  }),

  mockEndpoint('get', '/api/v1/routine/all', ({ request }) => {
    const denied = staffAccess(request);
    if (denied) return denied;
    return HttpResponse.json(withoutInactive(routines, request));
  }),

  // Las mismas rutinas con sus circuitos (`all-plus`).
  mockEndpoint('get', '/api/v1/routine/all-plus', ({ request }) => {
    const denied = staffAccess(request);
    if (denied) return denied;
    return HttpResponse.json(withoutInactive(routinesPlus, request));
  }),
];
