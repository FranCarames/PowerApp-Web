import type { HttpMethod, PathsFor } from '@/api/contractTypes';

// Qué endpoints se mockean. Con `VITE_USE_MOCKS=true`, MSW intercepta solo los que acá tienen
// `mock: true`; todo lo demás va al backend real. Lo que no figura acá es real.

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

// Vacío desde T44: el backend de Render publica todo lo que el front usa, así que no hay ningún mock y las
// cuentas de demo dejaron de existir (el backend rechaza su token falso). Los handlers y las fixtures que había
// se borraron: siguen en el historial de git. Para sumar un mock: la fixture, el handler con `mockEndpoint`
// en `handlers/<dominio>.ts` (y en `handlers/index.ts`) y su entrada acá con `mock: true` (README, "Backend y mocks").
export const registry: readonly RegistryEntry[] = [];

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
