import type { HttpMethod, PathsFor } from '@/api/contractTypes';

// Qué endpoints se mockean. Con `VITE_USE_MOCKS=true`, MSW intercepta solo los que acá tienen
// `mock: true`; todo lo demás va al backend real.
//
// Solo figuran los endpoints que tienen o tuvieron un mock: lo que no está acá es real. Cuando el
// backend implementa un endpoint, se pasa a `mock: false` y el handler queda por si hace falta.

/** Un endpoint del contrato: el método y el path tal como figuran en `paths`. */
type ContractEndpoint = {
  [M in HttpMethod]: { method: M; path: PathsFor<M> };
}[HttpMethod];

/** Un endpoint del contrato. Si el método o el path no existen en `openapi.json`, no compila. */
type ContractEntry = ContractEndpoint & { mock: boolean };

/**
 * Un endpoint sin contrato (PENDIENTE-CONTRATO), que solo existe como mock. `pending` es el id de la
 * dependencia del PLAN (B1 a B9). Cuando el path aparece en `openapi.json`, pasa a ser un
 * `ContractEntry`.
 */
interface PendingEntry {
  method: HttpMethod;
  path: string;
  pending: string;
  mock: true;
}

type RegistryEntry = ContractEntry | PendingEntry;

export const registry: readonly RegistryEntry[] = [
  // Entrenadores y ejercicios (públicos): solo con la sesión de una cuenta de demo (ver handlers/coaches.ts)
  { method: 'get', path: '/api/v1/coach/all', mock: true },
  { method: 'get', path: '/api/v1/coach/get/{id}', mock: true },
  { method: 'get', path: '/api/v1/exercise/all', mock: true },
  // Circuitos, rutinas y planificaciones: solo las cuentas de demo; las de verdad pasan al backend real
  { method: 'get', path: '/api/v1/routine/circuit/all', mock: true },
  { method: 'get', path: '/api/v1/routine/all', mock: true },
  { method: 'get', path: '/api/v1/planification/all', mock: true },
  {
    method: 'get',
    path: '/api/v1/planification/user/{id}/active',
    mock: true,
  },
  // Membresías (tipos)
  { method: 'get', path: '/api/v1/membership/all', mock: true },
  // Resumen de estados: solo las cuentas de demo; las de verdad pasan al backend real (ver handlers/memberships.ts)
  { method: 'get', path: '/api/v1/membership/status/summary', mock: true },
  { method: 'get', path: '/api/v1/membership/status/users', mock: true },
  // Pagos: solo los de las cuentas de demo; los demás ids pasan al backend real (ver handlers/payments.ts)
  { method: 'get', path: '/api/v1/membership/payment/user/{id}', mock: true },
  // Usuarios: solo las cuentas de demo; los demás emails pasan al backend real (ver handlers/users.ts)
  { method: 'get', path: '/api/v1/users/all', mock: true },
  { method: 'post', path: '/api/v1/users/set-active/{id}', mock: true },
  { method: 'post', path: '/api/v1/users/login', mock: true },
  { method: 'post', path: '/api/v1/users/change-password', mock: true },
  { method: 'get', path: '/api/v1/users/get/{id}', mock: true },
  { method: 'post', path: '/api/v1/users/edit', mock: true },
];

/** La clave de un endpoint: la misma forma que `PUBLIC_OPERATIONS` ("get /api/v1/users/all"). */
export function endpointKey(method: HttpMethod, path: string): string {
  return `${method} ${path}`;
}

const mockedKeys = new Set(
  registry
    .filter((entry) => entry.mock)
    .map((entry) => endpointKey(entry.method, entry.path)),
);

/** Si el endpoint está marcado como mock. Lo que no figura en el registry no se mockea. */
export function isMocked(method: HttpMethod, path: string): boolean {
  return mockedKeys.has(endpointKey(method, path));
}
