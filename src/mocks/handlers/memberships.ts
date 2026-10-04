import { HttpResponse } from 'msw/http';

import { mockEndpoint } from '../endpoint';
import { memberships } from '../fixtures/memberships';

/** Los mocks de Membresías (tipos). Cuáles están encendidos lo dice `registry.ts`. */
export const membershipMocks = [
  mockEndpoint('get', '/api/v1/membership/all', () =>
    HttpResponse.json(memberships),
  ),
];
