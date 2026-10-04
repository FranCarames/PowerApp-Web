import { QueryClient } from '@tanstack/react-query';

import { isApiError } from './errors';

const MAX_RETRIES = 2;

/**
 * Un 4xx es una respuesta del backend que se repetiría igual, así que no se reintenta. Los fallos de
 * red y los 5xx sí (por ejemplo, el primer request al backend de Render mientras despierta).
 */
function shouldRetry(failureCount: number, error: Error): boolean {
  if (failureCount >= MAX_RETRIES) return false;
  if (isApiError(error) && error.kind === 'http' && error.status < 500) {
    return false;
  }
  return true;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Pasar de una pestaña a otra no tiene que volver a pedir todo.
      staleTime: 30_000,
      retry: shouldRetry,
    },
    // Una mutación que falló puede haber llegado a escribir: repetirla sola es peligroso.
    mutations: { retry: false },
  },
});
