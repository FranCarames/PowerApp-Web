import { getErrorMessage, isApiError } from '@/api/errors';

/**
 * Qué dice un error de registrar un pago (CU-E-29). Desde el contrato del 24/10 el backend rechaza el pago
 * de un destinatario que no es alumno, de una cuenta cerrada y de un tipo dado de baja (los tres, 400), y
 * un alumno o un tipo que no existen dan 404. El motivo viene en el texto del servidor ("La cuenta del
 * alumno está cerrada…", "Membresía no encontrada"), que se reconoce pero nunca se muestra tal cual.
 */
export function registerPaymentErrorMessage(error: unknown): string {
  const status = isApiError(error) ? error.status : 0;
  const text = isApiError(error)
    ? (error.serverMessage ?? '').toLowerCase()
    : '';

  if (status === 400) {
    if (text.includes('cerrada')) {
      return 'La cuenta del alumno está cerrada: no se puede registrar el pago. Reactivala desde su detalle.';
    }
    if (text.includes('dado de baja')) {
      return 'Ese tipo de membresía está dado de baja. Elegí otro.';
    }
    if (text.includes('tiene que ser un alumno')) {
      return 'Solo se registran pagos de alumnos.';
    }
  }
  return getErrorMessage(error, {
    400: 'No se pudo registrar el pago. Revisá los datos e intentá de nuevo.',
    404: text.includes('membres')
      ? 'Ese tipo de membresía ya no existe. Elegí otro.'
      : 'El alumno ya no existe. Elegí a otro.',
  });
}
