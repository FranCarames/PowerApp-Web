/**
 * Cómo falló una llamada: `network` si no hubo respuesta (sin conexión, servidor caído) y `http`
 * si el backend respondió con un error.
 */
export type ApiErrorKind = 'network' | 'http';

interface ApiErrorInit {
  kind: ApiErrorKind;
  /** Estado HTTP. 0 si no hubo respuesta. */
  status: number;
  serverMessage: string | null;
  body: unknown;
  authenticated: boolean;
  cause?: unknown;
}

/**
 * Error de una llamada a la API. `serverMessage` es lo que dijo el backend: sirve para distinguir
 * casos (por ejemplo, el 403 de una cuenta deshabilitada) y para los logs, pero nunca se muestra
 * tal cual: para eso está `getErrorMessage`.
 */
export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number;
  readonly serverMessage: string | null;
  /** El cuerpo de la respuesta, ya parseado si era JSON. */
  readonly body: unknown;
  /** Si el request llevaba el token de la sesión. Un 401 con token es una sesión vencida. */
  readonly authenticated: boolean;

  constructor({
    kind,
    status,
    serverMessage,
    body,
    authenticated,
    cause,
  }: ApiErrorInit) {
    super(
      kind === 'network'
        ? 'No hubo respuesta del servidor'
        : `La API respondió ${status}${serverMessage ? `: ${serverMessage}` : ''}`,
      { cause },
    );
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
    this.serverMessage = serverMessage;
    this.body = body;
    this.authenticated = authenticated;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * El texto útil de un error del backend. Hay dos formatos: los services mandan `{ error }` y los
 * guards y la validación mandan `{ statusCode, message, error }`, con `message` como string o como
 * array de strings (y `error` es solo la frase HTTP, así que `message` tiene prioridad).
 */
export function extractServerMessage(body: unknown): string | null {
  if (typeof body === 'string') {
    // Un cuerpo que no es JSON suele ser la página de error de un proxy (HTML): no dice nada útil.
    const text = body.trim();
    return text && !text.startsWith('<') ? text.slice(0, 300) : null;
  }
  if (typeof body !== 'object' || body === null) return null;

  const { message, error } = body as { message?: unknown; error?: unknown };
  if (Array.isArray(message)) {
    const text = message.filter((item) => typeof item === 'string').join(' · ');
    if (text) return text;
  }
  if (typeof message === 'string' && message) return message;
  if (typeof error === 'string' && error) return error;
  return null;
}

/** Textos por defecto, en español rioplatense. Nunca se muestra el error crudo del servidor. */
const DEFAULT_MESSAGES = {
  network:
    'No pudimos conectarnos con el servidor. Revisá tu conexión e intentá de nuevo.',
  400: 'Revisá los datos ingresados e intentá de nuevo.',
  401: 'Tu sesión expiró. Volvé a iniciar sesión.',
  signInRequired: 'Necesitás iniciar sesión para hacer esto.',
  403: 'No tenés permiso para hacer esto.',
  404: 'No encontramos lo que buscabas.',
  409: 'Ya existe un registro con esos datos.',
  server: 'El servidor tuvo un problema. Intentá de nuevo en unos minutos.',
  fallback: 'Ocurrió un error inesperado. Intentá de nuevo.',
} as const;

/** Los 5xx con los que un proxy dice que no pudo hablar con el backend. */
const UNREACHABLE_STATUSES: ReadonlySet<number> = new Set([502, 503, 504]);

/** Si el estado es el de un proxy que no pudo hablar con el backend (502, 503 o 504). */
export function isUnreachableStatus(status: number): boolean {
  return UNREACHABLE_STATUSES.has(status);
}

/** Lo que dice el backend (en `message`) cuando un request autenticado llega con la cuenta dada de baja. */
const ACCOUNT_DISABLED_MESSAGE = 'La cuenta está deshabilitada.';

/**
 * Si es el 403 de una cuenta deshabilitada. Es el único 403 que cierra la sesión: el de
 * "Acceso denegado. Permisos insuficientes." (el rol no alcanza) no.
 */
export function isAccountDisabledError(error: ApiError): boolean {
  return (
    error.status === 403 && error.serverMessage === ACCOUNT_DISABLED_MESSAGE
  );
}

/**
 * Textos para sobrescribir los de por defecto en una pantalla, por estado HTTP (`409: 'El email ya
 * está en uso'`) o por tipo: `network` (no se pudo llegar al servidor: sin respuesta, 502, 503 o 504)
 * y `server` (cualquier otro 5xx).
 */
export type ErrorMessages = Partial<
  Record<number | 'network' | 'server', string>
>;

/**
 * El mensaje que se le muestra al usuario por un error de la API.
 *
 * @example
 * toast.error(getErrorMessage(error, { 409: 'El email ya está en uso' }));
 */
export function getErrorMessage(
  error: unknown,
  overrides: ErrorMessages = {},
): string {
  if (!isApiError(error)) return DEFAULT_MESSAGES.fallback;

  const byStatus = overrides[error.status];
  if (byStatus) return byStatus;
  // Sin respuesta, o con la del proxy de la plataforma cuando el backend no contesta (por ejemplo,
  // Render mientras despierta): para el usuario es lo mismo, no se pudo llegar al servidor.
  if (error.kind === 'network' || isUnreachableStatus(error.status)) {
    return overrides.network ?? DEFAULT_MESSAGES.network;
  }
  if (error.status >= 500) return overrides.server ?? DEFAULT_MESSAGES.server;
  // Un 401 sin token no es una sesión vencida: se pidió algo que requiere iniciar sesión.
  if (error.status === 401 && !error.authenticated) {
    return DEFAULT_MESSAGES.signInRequired;
  }

  return (
    (DEFAULT_MESSAGES as Partial<Record<number, string>>)[error.status] ??
    DEFAULT_MESSAGES.fallback
  );
}
