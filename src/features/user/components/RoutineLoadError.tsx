import { getErrorMessage, isApiError } from '@/api/errors';
import { ErrorState } from '@/shared/ui';

/** Lo que el error necesita de la consulta, sea de la vía individual o de la del plan. */
export interface RoutineQuery {
  isPending: boolean;
  isError: boolean;
  error: Error | null;
  isRefetching: boolean;
  refetch: () => unknown;
}

/**
 * El error de una rutina que no se puede abrir (el detalle y sus ejercicios salen de la misma consulta):
 * 403 y 404 son definitivos, no se reintentan.
 */
export function RoutineLoadError({ query }: { query: RoutineQuery }) {
  const { error } = query;
  if (isApiError(error) && error.status === 403) {
    return (
      <ErrorState
        title="Esta rutina no es tuya"
        message="Solo podés ver las rutinas que te asignaron a vos."
      />
    );
  }
  if (isApiError(error) && (error.status === 404 || error.status === 400)) {
    // El backend distingue la rutina que el entrenador quitó del plan sin que el alumno hiciera nada.
    const server = error.serverMessage ?? '';
    let message =
      'Puede que tu entrenador la haya cambiado. Volvé al inicio y buscala de nuevo.';
    if (server.includes('quitada')) {
      message = 'Tu entrenador la quitó del plan y no hiciste nada en ella.';
    } else if (server.includes('no pertenece')) {
      // CU-U-09: la rutina del enlace no es de esa planificación.
      message =
        'Esa rutina no es de tu planificación. Volvé al inicio y abrila desde ahí.';
    }
    return <ErrorState title="No encontramos la rutina" message={message} />;
  }
  return (
    <ErrorState
      message={getErrorMessage(error)}
      onRetry={() => void query.refetch()}
      retrying={query.isRefetching}
    />
  );
}
