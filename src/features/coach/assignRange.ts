import { formatWeekdayDate } from '@/shared/lib/dates';

// Los textos de las semanas al asignar una planificación (CU-E-13): la ayuda de «Semanas» y el resumen del
// rango que resulta, que se ve antes de asignar.

/** Cuánto dura el plan, debajo de «Semanas». Con duración 0 no hay qué precargar y el campo es obligatorio. */
export function planWeeksHint(duration: number): string {
  if (duration <= 0) {
    return 'Este plan no tiene duración fija: indicá cuántas semanas dura.';
  }
  return `El plan dura ${duration} ${duration === 1 ? 'semana' : 'semanas'}.`;
}

/**
 * Un día del resumen: «lun 9 nov», en minúscula, con el año si no es el año en curso («dom 3 ene 2027»).
 * Cada fecha lleva el suyo: un rango que cruza de año lo dice solo en la que no es de este año.
 */
export function formatRangeDay(day: string, today: Date = new Date()): string {
  const text = formatWeekdayDate(day).toLowerCase();
  const year = Number(day.slice(0, 4));
  return year === today.getFullYear() ? text : `${text} ${year}`;
}

/**
 * Qué ve el alumno si las semanas elegidas no son las del plan: las de más no tienen rutinas y, con menos,
 * el plan se corta. `null` si son las mismas o si el plan no tiene duración fija (no hay contra qué comparar).
 */
export function weeksDifference(
  duration: number,
  weeks: number,
): string | null {
  if (duration <= 0 || weeks === duration) return null;
  if (weeks < duration) return `El alumno ve hasta la semana ${weeks}.`;
  const first = duration + 1;
  if (weeks === first) {
    return `La semana ${first} no tiene rutinas: el alumno la ve vacía.`;
  }
  const join = weeks === first + 1 ? 'y' : 'a';
  return `Las semanas ${first} ${join} ${weeks} no tienen rutinas: el alumno las ve vacías.`;
}
