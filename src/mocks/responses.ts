import { HttpResponse } from 'msw/http';

// Las respuestas de los mocks imitan las del backend de verdad (PowerApp-Docs: Doc/app-ios/
// contexto-backend.md), porque el cliente las lee distinto según el formato (src/api/errors.ts).

/** Error que arma un service: `{ error }`. Es el de los errores de negocio (404, 409, el login). */
export interface ServiceErrorBody {
  error: string;
}

/**
 * Error de un guard o de la validación de los DTOs. El texto útil está en `message`, que puede ser
 * un string o un array de strings; `error` es solo la frase HTTP.
 */
export interface GuardErrorBody {
  statusCode: number;
  message: string | string[];
  error?: string;
}

export type MockErrorBody = ServiceErrorBody | GuardErrorBody;

const HTTP_PHRASES: Partial<Record<number, string>> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
};

/**
 * Un error como los de los services: `{ error: 'Credenciales inválidas' }`.
 *
 * @example
 * return serviceError(404, 'Membresía no encontrada');
 */
export function serviceError(status: number, message: string) {
  return HttpResponse.json<ServiceErrorBody>({ error: message }, { status });
}

/**
 * Un error como los de los guards y la validación: `{ statusCode, message, error }`.
 *
 * @example
 * return guardError(401, 'Unauthorized');
 * return guardError(400, ['name must be a string', 'price must be a number']);
 */
export function guardError(status: number, message: string | string[]) {
  return HttpResponse.json<GuardErrorBody>(
    { statusCode: status, message, error: HTTP_PHRASES[status] },
    { status },
  );
}

/**
 * Una respuesta sin cuerpo: la de los endpoints que el contrato declara sin cuerpo (el logout, los
 * DELETE, recuperar y cambiar la contraseña).
 */
export function emptyResponse() {
  return new HttpResponse<undefined>(null);
}

/**
 * Los headers con el token, como los manda el login y el registro: `Authorization: Bearer <jwt>`
 * en la respuesta, no en el body.
 *
 * @example
 * return HttpResponse.json(user, { headers: authTokenHeaders(token) });
 */
export function authTokenHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}
