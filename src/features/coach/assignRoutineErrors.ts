import { getErrorMessage, isApiError } from '@/api/errors';

/**
 * El texto que mandó el servidor, en minúscula y sin lo que va entre comillas simples: el 400 de una rutina
 * dada de baja lleva su nombre ("La rutina 'Día A' está dada de baja…"), que lo puso quien la armó y podría
 * decir cualquier cosa.
 */
function serverText(error: unknown): string {
  const server = isApiError(error) ? (error.serverMessage ?? '') : '';
  return server.replace(/'[^']*'/g, '').toLowerCase();
}

/**
 * Qué dice un error de asignar una rutina puntual a un alumno (CU-E-19). Los 400 y 404 traen su motivo en el
 * texto del servidor ("La cuenta del alumno está cerrada…", "Rutina no encontrada"), que se reconoce pero
 * nunca se muestra tal cual. El texto solo se mira en el 400: el del 409 ("El alumno ya tiene esa rutina…")
 * nombra al alumno igual que los otros.
 */
export function assignRoutineErrorMessage(error: unknown): string {
  const status = isApiError(error) ? error.status : 0;
  const text = serverText(error);

  if (status === 400) {
    if (text.includes('dada de baja')) {
      return 'La rutina está dada de baja y no se puede asignar. Reactivala desde su editor.';
    }
    if (text.includes('cerrada')) {
      return 'La cuenta del alumno está cerrada: no se le puede asignar una rutina. Reactivala desde su detalle.';
    }
    if (text.includes('sólo puede asignarse') || text.includes('solo puede')) {
      return 'Solo se le puede asignar una rutina a un alumno.';
    }
    if (text.includes('fecha')) {
      return 'Elegí un día válido.';
    }
  }
  return getErrorMessage(error, {
    403: 'No tenés permiso para asignar rutinas.',
    404: text.includes('rutina')
      ? 'La rutina ya no existe. Volvé a la lista.'
      : 'El alumno ya no existe. Elegí a otro.',
    409: 'Este alumno ya tiene esa rutina asignada ese día. Elegí otro día.',
  });
}

/**
 * Qué dice un error de quitar una rutina puntual (CU-E-20). El 409 es el de una rutina que el alumno ya
 * entrenó: no se borra, para no perder su historial.
 */
export function removeAssignedRoutineErrorMessage(error: unknown): string {
  return getErrorMessage(error, {
    404: 'Esa asignación ya no existe.',
    409: 'El alumno ya entrenó esta rutina, así que no se puede quitar: su historial se conserva.',
  });
}
