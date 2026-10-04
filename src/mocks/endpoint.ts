import { delay, type DefaultBodyType, type JsonBodyType } from 'msw';
import {
  http,
  type HttpHandler,
  type HttpResponse,
  type StrictRequest,
} from 'msw/http';

import type {
  DataOf,
  HttpMethod,
  OperationOf,
  PathsFor,
  RequestOptionsFor,
} from '@/api/contractTypes';

import type { MockErrorBody } from './responses';

/** Un mock listo para el registry: de qué endpoint es y el handler de MSW que lo responde. */
export interface MockEndpoint {
  readonly method: HttpMethod;
  readonly path: string;
  readonly handler: HttpHandler;
}

type MaybePromise<T> = T | Promise<T>;

/** Los parámetros de ruta de un path del contrato: `/users/get/{id}` → `'id'`. */
type PathParamNames<P extends string> =
  P extends `${string}{${infer Name}}${infer Rest}`
    ? Name | PathParamNames<Rest>
    : never;

type RequestBodyOf<O> =
  Exclude<RequestOptionsFor<O>['body'], undefined> extends infer Body extends
    JsonBodyType
    ? [Body] extends [never]
      ? undefined
      : Body
    : undefined;

/** Lo que puede responder el endpoint: su dato, o un error con alguno de los dos formatos. */
type ResponseBodyOf<O> =
  ([DataOf<O>] extends [void] ? undefined : DataOf<O>) | MockErrorBody;

/** Lo que recibe el resolver: el request (con el body tipado como el DTO) y los parámetros de ruta. */
export interface MockInfo<Body extends JsonBodyType, Params extends string> {
  request: StrictRequest<Body>;
  params: Record<Params, string>;
}

/**
 * Responde un endpoint del contrato. Devuelve `HttpResponse.json(dato)`, o un error de
 * `responses.ts`: el compilador exige que el dato sea el que declara el contrato.
 */
export type MockResolver<M extends HttpMethod, P extends PathsFor<M>> = (
  info: MockInfo<RequestBodyOf<OperationOf<M, P>>, PathParamNames<P>>,
) => MaybePromise<HttpResponse<ResponseBodyOf<OperationOf<M, P>>>>;

/** El path de MSW: `{id}` pasa a `:id` y un `*` adelante hace que matchee cualquier origen (URL absoluta o proxy). */
function toMswPath(path: string): string {
  return `*${path.replace(/\{(\w+)\}/g, ':$1')}`;
}

// Los handlers quedan sin tipos de body acá abajo: los tipos de `MockResolver` ya validaron lo que
// devuelve cada mock, y MSW no entiende de contratos.
type LooseResolver = (info: {
  request: StrictRequest<DefaultBodyType>;
  params: Record<string, string>;
}) => MaybePromise<Response>;

function createMock(
  method: HttpMethod,
  path: string,
  resolver: LooseResolver,
): MockEndpoint {
  return {
    method,
    path,
    handler: http[method](toMswPath(path), async ({ request, params }) => {
      // Un backend de verdad no contesta al instante: sin esto, los estados de carga no se ven.
      await delay();
      return resolver({ request, params: params as Record<string, string> });
    }),
  };
}

/**
 * Mock de un endpoint del contrato (`openapi.json`). El método y el path se validan contra el
 * contrato, y el resolver, contra el body del request y la respuesta del endpoint.
 *
 * @example
 * mockEndpoint('get', '/api/v1/membership/all', () => HttpResponse.json(memberships));
 * mockEndpoint('get', '/api/v1/membership/get/{id}', ({ params }) => {
 *   const found = memberships.find((m) => m.id === params.id);
 *   return found ? HttpResponse.json(found) : serviceError(404, 'Membresía no encontrada');
 * });
 */
export function mockEndpoint<M extends HttpMethod, P extends PathsFor<M>>(
  method: M,
  path: P,
  resolver: MockResolver<M, P>,
): MockEndpoint {
  return createMock(method, path, resolver as unknown as LooseResolver);
}

/**
 * Mock de un endpoint que el contrato todavía no tiene (PENDIENTE-CONTRATO). Los tipos del body y
 * de la respuesta salen de `src/api/pending.ts`. No inventa endpoints reales: solo existe como mock,
 * y tiene que figurar en el registry con su `pending`.
 *
 * @example
 * mockPendingEndpoint<EditCoachRequest, Coach>('post', '/api/v1/coach/edit/{id}', ...);
 */
export function mockPendingEndpoint<
  Body extends JsonBodyType = undefined,
  Data extends JsonBodyType = undefined,
>(
  method: HttpMethod,
  path: string,
  resolver: (info: {
    request: StrictRequest<Body>;
    params: Record<string, string>;
  }) => MaybePromise<HttpResponse<Data | MockErrorBody>>,
): MockEndpoint {
  return createMock(method, path, resolver as unknown as LooseResolver);
}
