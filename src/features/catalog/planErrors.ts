import { getErrorMessage, isApiError } from '@/api/errors';
import { joinWithAnd } from '@/shared/lib/text';

/**
 * Las rutinas dadas de baja que nombra el servidor al rechazar un alta (CU-E-12a y CU-E-12b): "La rutina
 * 'Día A' está dada de baja…" con una, y "Estas rutinas están dadas de baja y no pueden asignarse: 'Día A',
 * 'Día B'." con varias. Si el texto no tiene esa forma, ninguna.
 */
function inactiveRoutineNames(server: string): string[] {
  const one = /^La rutina '(.+)' está dada de baja/.exec(server);
  if (one?.[1]) return [one[1]];
  const several = /dadas de baja y no pueden asignarse: '(.+)'\.?$/.exec(
    server,
  );
  return several?.[1] ? several[1].split("', '") : [];
}

/**
 * Qué dice un error de guardar o cambiar una planificación. Los 400 y 404 del plan y de sus rutinas
 * traen su motivo en el texto del servidor ("La planificación está dada de baja…", "La semana N supera la
 * duración…", "Rutina no encontrada"), que se reconoce pero nunca se muestra tal cual.
 */
export function planErrorMessage(error: unknown): string {
  const server = isApiError(error) ? (error.serverMessage ?? '') : '';
  const week = /semana (\d+)/.exec(server)?.[1];

  if (server.includes('la duración no puede ser menor')) {
    return `La planificación tiene rutinas en la semana ${week ?? 'más alta'}: la duración no puede ser menor. Quitá esas rutinas o dejá una duración mayor.`;
  }
  if (server.includes('no se puede reincorporar')) {
    return `Alguna rutina quedó en la semana ${week ?? 'que tenía'}, que la duración del plan ya no cubre. Reincorporalas de a una, eligiendo una semana válida.`;
  }
  if (server.includes('supera la duración')) {
    return `La semana ${week ?? 'elegida'} supera la duración del plan. Elegí una semana válida.`;
  }
  if (server.startsWith('La planificación') && server.includes('de baja')) {
    return 'La planificación está dada de baja y no se puede cambiar. Reactivala primero.';
  }
  if (server.includes('de baja')) {
    // El CU pide decir cuál es: el servidor las nombra.
    const names = inactiveRoutineNames(server);
    if (names.length === 1) {
      return `${names[0]} está dada de baja y no se puede agregar. Sacala de la selección e intentá de nuevo.`;
    }
    if (names.length > 1) {
      return `${joinWithAnd(names)} están dadas de baja y no se pueden agregar. Sacalas de la selección e intentá de nuevo.`;
    }
    return 'Alguna de las rutinas está dada de baja y no se puede agregar. Sacala de la selección e intentá de nuevo.';
  }
  return getErrorMessage(error, {
    404: server.includes('Planificación no encontrada')
      ? 'La planificación ya no existe. Volvé a la lista.'
      : server.includes('Asignaci')
        ? 'Alguna de las rutinas ya no está en el plan. Volvé a abrir la planificación.'
        : 'Alguna de las rutinas ya no existe. Sacala de la selección e intentá de nuevo.',
  });
}
