import type { paths } from './schema';

// Tipos que derivan del contrato (schema.d.ts) lo que se puede pasar a cada endpoint y lo que
// devuelve. Con ellos el cliente rechaza en compilación un path que no existe, un parámetro de
// ruta que falta o un body que no es el del DTO.

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

/** Los paths del contrato que tienen una operación para el método M. */
export type PathsFor<M extends HttpMethod> = {
  [P in keyof paths]: paths[P][M] extends object ? P : never;
}[keyof paths];

/** La operación (`operations[...]` del contrato) de un método sobre un path. */
export type OperationOf<
  M extends HttpMethod,
  P extends keyof paths,
> = NonNullable<paths[P][M]>;

type ParamsOption<O> = O extends { parameters: { path: infer P } }
  ? { params: P }
  : { params?: undefined };

type QueryOption<O> = O extends { parameters: { query?: infer Q } }
  ? [Exclude<Q, undefined>] extends [never]
    ? { query?: undefined }
    : { query?: Exclude<Q, undefined> }
  : { query?: undefined };

type JsonBodyOf<R> = R extends { content: { 'application/json': infer B } }
  ? B
  : never;

type BodyOption<O> = O extends { requestBody: infer R }
  ? [JsonBodyOf<R>] extends [never]
    ? { body?: undefined }
    : { body: JsonBodyOf<R> }
  : O extends { requestBody?: infer R }
    ? [JsonBodyOf<NonNullable<R>>] extends [never]
      ? { body?: undefined }
      : { body?: JsonBodyOf<NonNullable<R>> }
    : { body?: undefined };

/** Lo que acepta un endpoint: `params` (path), `query` y `body`, según lo que declare el contrato. */
export type RequestOptionsFor<O> = ParamsOption<O> &
  QueryOption<O> &
  BodyOption<O> & { signal?: AbortSignal };

/** Los argumentos después del path: el objeto de opciones es obligatorio solo si algo lo es. */
export type OptionsArg<O> =
  Partial<RequestOptionsFor<O>> extends RequestOptionsFor<O>
    ? [options?: RequestOptionsFor<O>]
    : [options: RequestOptionsFor<O>];

type SuccessStatus = 200 | 201 | 202 | 203 | 204 | 205 | 206;

/** Lo que devuelve el endpoint cuando sale bien. `void` si el contrato no declara cuerpo. */
export type DataOf<O> = O extends { responses: infer R }
  ? {
      [S in Extract<keyof R, SuccessStatus>]: R[S] extends {
        content: { 'application/json': infer D };
      }
        ? D
        : void;
    }[Extract<keyof R, SuccessStatus>]
  : never;
