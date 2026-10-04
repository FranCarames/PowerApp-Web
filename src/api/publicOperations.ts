/**
 * Generado por scripts/gen-public-operations.mjs a partir de src/api/openapi.json.
 * No se edita a mano: se regenera con `npm run api:gen`.
 *
 * Las operaciones del contrato que no piden token. Cada entrada es "<método> <path>", con el path
 * tal como figura en `paths` (con las llaves de los parámetros: /api/v1/users/get/{id}).
 */
export const PUBLIC_OPERATIONS: ReadonlySet<string> = new Set([
  'get /api/v1/coach/all',
  'get /api/v1/coach/get/{id}',
  'get /api/v1/exercise/ExMuscles/all',
  'get /api/v1/exercise/all',
  'get /api/v1/membership/all',
  'get /api/v1/membership/get/{id}',
  'get /api/v1/muscles/all',
  'get /api/v1/muscles/get/{id}',
  'get /api/v1/muscles/mg/all',
  'get /api/v1/muscles/mg/get/{id}',
  'post /api/v1/users/login',
  'post /api/v1/users/logout',
  'post /api/v1/users/recover-password',
  'post /api/v1/users/register',
]);
