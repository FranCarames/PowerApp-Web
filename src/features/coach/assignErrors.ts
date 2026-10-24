import { getErrorMessage, isApiError } from '@/api/errors';

/**
 * Qué dice un error de asignar una planificación a un alumno (CU-E-13). Los 400, 403 y 404 traen su motivo
 * en el texto del servidor ("La planificación no tiene duración fija…", "Tu usuario no está registrado como
 * entrenador."), que se reconoce pero nunca se muestra tal cual. El 409 (solapamiento) no pasa por acá: la
 * pantalla lo muestra con las asignaciones que se pisan.
 */
export function assignErrorMessage(error: unknown): string {
  const server = isApiError(error) ? (error.serverMessage ?? '') : '';
  const text = server.toLowerCase();

  if (text.includes('duración fija')) {
    return 'Este plan no tiene duración fija: indicá hasta cuándo dura.';
  }
  if (text.includes('anterior')) {
    return 'El fin no puede ser anterior al inicio.';
  }
  if (text.includes('rutinas vigentes') || text.includes('sin rutinas')) {
    return 'La planificación no tiene rutinas vigentes. Agregale alguna en el editor antes de asignarla.';
  }
  if (text.includes('dada de baja')) {
    return 'La planificación está dada de baja y no se puede asignar. Reactivala primero.';
  }
  if (text.includes('calendario')) {
    return 'El fin que resulta queda fuera del calendario. Indicá un día de fin más cercano.';
  }
  if (text.includes('alumno') || text.includes('cuenta')) {
    return 'Solo se le puede asignar una planificación a un alumno con la cuenta abierta.';
  }
  return getErrorMessage(error, {
    403: text.includes('entrenador')
      ? 'Tu usuario no figura como entrenador activo, así que no podés asignar planificaciones. Avisale al Admin.'
      : 'Solo un entrenador puede asignar planificaciones.',
    404: text.includes('planificaci')
      ? 'La planificación ya no existe. Volvé a la lista.'
      : 'El alumno ya no existe. Elegí a otro.',
  });
}
