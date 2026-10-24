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

// Estado al 24/10/2026 (T44): todo está apagado. El backend de Render publica cada endpoint de esta lista y no
// queda ningún mock pendiente (`PendingEntry`), así que MSW no responde nada y el front va siempre al backend
// real. Con eso dejan de existir las cuentas de demo: el backend rechaza su token falso (401 que cierra la
// sesión) y el login de demo ya no se mockea. Los handlers y las fixtures quedan en `src/mocks/` por si hace
// falta recorrer una pantalla sin backend: se pasa su entrada a `mock: true` (ver README, "Backend y mocks").
export const registry: readonly RegistryEntry[] = [
  // Entrenadores (piden token de admin desde el 17/10) y ejercicios
  { method: 'get', path: '/api/v1/coach/all', mock: false },
  { method: 'get', path: '/api/v1/coach/get/{id}', mock: false },
  { method: 'get', path: '/api/v1/exercise/all', mock: false },
  { method: 'get', path: '/api/v1/exercise/{id}', mock: false },
  { method: 'post', path: '/api/v1/exercise/create', mock: false },
  { method: 'post', path: '/api/v1/exercise/edit/{id}', mock: false },
  { method: 'delete', path: '/api/v1/exercise/{id}', mock: false },
  { method: 'get', path: '/api/v1/muscles/all', mock: false },
  { method: 'get', path: '/api/v1/muscles/mg/all', mock: false },
  { method: 'post', path: '/api/v1/muscles/create', mock: false },
  { method: 'post', path: '/api/v1/muscles/edit/{id}', mock: false },
  { method: 'delete', path: '/api/v1/muscles/{id}', mock: false },
  { method: 'post', path: '/api/v1/muscles/mg/create', mock: false },
  { method: 'post', path: '/api/v1/muscles/mg/edit/{id}', mock: false },
  { method: 'delete', path: '/api/v1/muscles/mg/{id}', mock: false },
  // Alta, edición (T37: es el mismo promote_user, el backend no tiene un edit) y baja de un entrenador
  { method: 'post', path: '/api/v1/coach/promote_user', mock: false },
  { method: 'post', path: '/api/v1/coach/delete_coach/{id}', mock: false },
  // Circuitos: apagados el 6/10 (T44, primer tramo). `routine/all-plus` es de rutinas, pero lo necesita el
  // listado de circuitos para contar en cuántas rutinas se usa cada uno.
  { method: 'get', path: '/api/v1/routine/circuit/all', mock: false },
  { method: 'get', path: '/api/v1/routine/circuit/all-plus', mock: false },
  { method: 'get', path: '/api/v1/routine/circuit/{id}', mock: false },
  { method: 'post', path: '/api/v1/routine/circuit/create', mock: false },
  { method: 'post', path: '/api/v1/routine/circuit/edit/{id}', mock: false },
  {
    method: 'post',
    path: '/api/v1/routine/circuit/set-active/{id}',
    mock: false,
  },
  { method: 'get', path: '/api/v1/routine/all-plus', mock: false },
  // Rutinas y planificaciones
  { method: 'get', path: '/api/v1/routine/all', mock: false },
  // El home del alumno y el detalle de una rutina, individual o de una semana del plan
  { method: 'get', path: '/api/v1/routine/home/{userId}', mock: false },
  { method: 'get', path: '/api/v1/routine/assign-user/{id}', mock: false },
  // Marcar y desmarcar un ejercicio de una rutina individual. Dentro de un plan (BE-20c) el par de endpoints
  // es real desde el principio (T40b) y no tuvo mock: por eso no figura acá.
  {
    method: 'post',
    path: '/api/v1/routine/assign-user/{id}/finished',
    mock: false,
  },
  {
    method: 'delete',
    path: '/api/v1/routine/assign-user/{id}/finished/{routineExerciseId}',
    mock: false,
  },
  {
    method: 'get',
    path: '/api/v1/routine/assign-plan/{userPlanificationId}/{routineAsignationId}',
    mock: false,
  },
  // El historial de entrenamientos de un alumno (B6)
  { method: 'get', path: '/api/v1/routine/history/{userId}', mock: false },
  { method: 'get', path: '/api/v1/planification/all', mock: false },
  { method: 'get', path: '/api/v1/planification/user/{userId}', mock: false },
  // Membresías (tipos)
  { method: 'get', path: '/api/v1/membership/all', mock: false },
  { method: 'post', path: '/api/v1/membership/create', mock: false },
  { method: 'post', path: '/api/v1/membership/edit/{id}', mock: false },
  { method: 'post', path: '/api/v1/membership/set-active/{id}', mock: false },
  { method: 'get', path: '/api/v1/membership/type/users', mock: false },
  // Resumen de estados, listas por estado, registrar un pago e historial de pagos
  { method: 'get', path: '/api/v1/membership/status/summary', mock: false },
  { method: 'get', path: '/api/v1/membership/status/users', mock: false },
  { method: 'post', path: '/api/v1/membership/payment/register', mock: false },
  { method: 'get', path: '/api/v1/membership/payment/user/{id}', mock: false },
  // RMs
  { method: 'get', path: '/api/v1/user_rm/user/{id}', mock: false },
  { method: 'post', path: '/api/v1/user_rm/potential', mock: false },
  { method: 'post', path: '/api/v1/user_rm/create', mock: false },
  { method: 'post', path: '/api/v1/user_rm/edit/{id}', mock: false },
  { method: 'delete', path: '/api/v1/user_rm/{id}', mock: false },
  // Usuarios (el login incluido: devuelve `password_change_required` del backend)
  { method: 'get', path: '/api/v1/users/all', mock: false },
  { method: 'post', path: '/api/v1/users/set-active/{id}', mock: false },
  { method: 'post', path: '/api/v1/users/login', mock: false },
  { method: 'post', path: '/api/v1/users/change-password', mock: false },
  { method: 'get', path: '/api/v1/users/get/{id}', mock: false },
  { method: 'post', path: '/api/v1/users/edit', mock: false },
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
