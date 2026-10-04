import { API_URL } from './config';
import type {
  DataOf,
  HttpMethod,
  OperationOf,
  OptionsArg,
  PathsFor,
} from './contractTypes';
import { trackRequest } from './coldStart';
import { ApiError, extractServerMessage, isUnreachableStatus } from './errors';
import { PUBLIC_OPERATIONS } from './publicOperations';

// Cliente de la API: un wrapper sobre `fetch` que pone la URL base y el token, parsea la respuesta
// y convierte los errores en `ApiError`. `api` y `apiRequest` están tipados con el contrato
// (schema.d.ts); `request` no, y sirve para lo que el contrato no describe.

interface ClientConfig {
  /** El token de la sesión, o `null` si no hay. */
  getToken: () => string | null;
  /** Se llama cuando un request que llevaba token recibe 401: la sesión murió. */
  onUnauthorized?: (error: ApiError) => void;
  /**
   * Se llama cuando un request que llevaba token recibe 403. Puede ser una cuenta deshabilitada (la
   * sesión murió) o un rol sin permisos (no): quien lo conecta lo distingue con `isAccountDisabledError`.
   */
  onForbidden?: (error: ApiError) => void;
}

let config: ClientConfig = { getToken: () => null };

/** Conecta el cliente con el resto de la app (la sesión). Se llama una vez, al arrancar. */
export function configureApi(next: Partial<ClientConfig>): void {
  config = { ...config, ...next };
}

type QueryValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Array<string | number | boolean>;

export interface RequestOptions {
  query?: Record<string, QueryValue>;
  body?: unknown;
  signal?: AbortSignal;
  /** Por defecto se manda el token si hay sesión. Con `false` no se manda (login, registro). */
  auth?: boolean;
}

export interface ApiResult<T> {
  data: T;
  /** La respuesta, para leer los headers: el login devuelve el token en `Authorization`. */
  response: Response;
}

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null) continue;
    for (const item of Array.isArray(value) ? value : [value]) {
      search.append(key, String(item));
    }
  }
  const queryString = search.toString();
  return `${API_URL}${path}${queryString ? `?${queryString}` : ''}`;
}

/** El cuerpo de la respuesta: JSON si lo es, el texto tal cual si no, y `undefined` si viene vacío. */
async function readBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/**
 * Hace un request sin tipos del contrato. Sirve para los endpoints que el contrato no tiene
 * (PENDIENTE-CONTRATO) o describe mal; el resto va por `api` o `apiRequest`.
 *
 * Rechaza siempre con `ApiError`, salvo que quien llama cancele con su `signal`.
 */
export async function request<T>(
  method: HttpMethod,
  path: string,
  options: RequestOptions = {},
): Promise<ApiResult<T>> {
  const token = options.auth === false ? null : config.getToken();
  const authenticated = token !== null;

  const headers = new Headers({ Accept: 'application/json' });
  if (options.body !== undefined)
    headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  // Cuenta cuánto tarda el request, para avisar del arranque en frío (ver coldStart.ts).
  const finishTracking = trackRequest();
  let serverResponded = false;
  let response: Response;
  let body: unknown;
  try {
    response = await fetch(buildUrl(path, options.query), {
      method: method.toUpperCase(),
      headers,
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    });
    serverResponded = !isUnreachableStatus(response.status);
    body = await readBody(response);
  } catch (cause) {
    if (options.signal?.aborted) throw cause;
    throw new ApiError({
      kind: 'network',
      status: 0,
      serverMessage: null,
      body: undefined,
      authenticated,
      cause,
    });
  } finally {
    finishTracking(serverResponded);
  }

  if (!response.ok) {
    const error = new ApiError({
      kind: 'http',
      status: response.status,
      serverMessage: extractServerMessage(body),
      body,
      authenticated,
    });
    // Si la sesión cambió mientras el request estaba en vuelo (otro login, un cierre de sesión), el
    // error es de la sesión anterior y no tiene que cerrar la actual.
    if (authenticated && config.getToken() === token) {
      if (response.status === 401) config.onUnauthorized?.(error);
      if (response.status === 403) config.onForbidden?.(error);
    }
    throw error;
  }

  return { data: body as T, response };
}

/** El token que el backend manda en el header `Authorization` del login y del registro. */
export function readAuthToken(response: Response): string | null {
  const header = response.headers.get('Authorization');
  const token = header?.replace(/^Bearer\s+/i, '').trim();
  return token || null;
}

interface TypedOptions {
  params?: Record<string, unknown>;
  query?: Record<string, QueryValue>;
  body?: unknown;
  signal?: AbortSignal;
}

/** Reemplaza las llaves del path del contrato (`/users/get/{id}`) por los valores de `params`. */
function fillPath(template: string, params: TypedOptions['params']): string {
  return template.replace(/\{(\w+)\}/g, (_, name: string) => {
    const value = params?.[name];
    if (value === undefined || value === null || value === '') {
      throw new Error(`Falta el parámetro de ruta "${name}" en ${template}`);
    }
    return encodeURIComponent(String(value));
  });
}

/**
 * Hace un request a un endpoint del contrato, con los tipos del contrato, y devuelve el dato
 * junto con la respuesta. Para leer los headers: `readAuthToken(response)`.
 */
export async function apiRequest<M extends HttpMethod, P extends PathsFor<M>>(
  method: M,
  path: P,
  ...args: OptionsArg<OperationOf<M, P>>
): Promise<ApiResult<DataOf<OperationOf<M, P>>>> {
  // Los tipos del contrato ya validaron los argumentos; acá se leen como opciones sueltas.
  // (Sin este paso por `unknown`, TypeScript expande las ~70 operaciones y se rinde.)
  const options = ((args as unknown[])[0] ?? {}) as TypedOptions;
  return request(method, fillPath(path, options.params), {
    query: options.query,
    body: options.body,
    signal: options.signal,
    // El contrato dice qué endpoints piden token: a los demás no se les manda.
    auth: PUBLIC_OPERATIONS.has(`${method} ${path}`) ? false : undefined,
  });
}

/**
 * Los endpoints del contrato. Devuelven el dato. Para una query, `signal` es el de TanStack Query.
 *
 * @example
 * api.get('/api/v1/membership/all', { signal });
 * api.get('/api/v1/users/get/{id}', { params: { id } });
 * api.post('/api/v1/users/edit', { body: { first_name: 'Franco' } });
 */
export const api = {
  get: async <P extends PathsFor<'get'>>(
    path: P,
    ...args: OptionsArg<OperationOf<'get', P>>
  ) => (await apiRequest('get', path, ...args)).data,
  post: async <P extends PathsFor<'post'>>(
    path: P,
    ...args: OptionsArg<OperationOf<'post', P>>
  ) => (await apiRequest('post', path, ...args)).data,
  delete: async <P extends PathsFor<'delete'>>(
    path: P,
    ...args: OptionsArg<OperationOf<'delete', P>>
  ) => (await apiRequest('delete', path, ...args)).data,
};
