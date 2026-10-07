const monthYear = new Intl.DateTimeFormat('es-AR', {
  month: 'long',
  year: 'numeric',
});

/** "marzo 2025", a partir de una fecha ISO. Sin la preposición "de" que agrega `Intl`. */
export function formatMonthYear(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const parts = monthYear.formatToParts(date);
  const month = parts.find((part) => part.type === 'month')?.value ?? '';
  const year = parts.find((part) => part.type === 'year')?.value ?? '';
  return `${month} ${year}`.trim();
}

// Los meses abreviados del prototipo. `Intl` abrevia septiembre como "sept", y el prototipo, "Sep".
const SHORT_MONTHS = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
];

// Una fecha sin hora ("2026-07-15", como la de un RM): JavaScript la lee en UTC y, en Argentina, caería en el día anterior.
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

/** La fecha de un ISO: una fecha sin hora es el día de calendario local, y una con hora, ese instante. */
function parseDate(iso: string): Date {
  const dateOnly = DATE_ONLY.exec(iso);
  return dateOnly
    ? new Date(
        Number(dateOnly[1]),
        Number(dateOnly[2]) - 1,
        Number(dateOnly[3]),
      )
    : new Date(iso);
}

/**
 * "15 Jul 2026", a partir de una fecha ISO, en el día local de quien la mira. Una fecha sin hora es
 * un día del calendario y se muestra tal cual, sin correrla por la zona horaria.
 */
export function formatDate(iso: string): string {
  const date = parseDate(iso);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getDate()} ${SHORT_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Cuántos días de calendario hay de hoy a la fecha, en el día local de quien mira: 0 es hoy, 1 es
 * mañana y -1 es ayer. Cuenta días enteros: un vencimiento de hoy a las 23:59 es 0, no "11 horas".
 */
export function daysUntil(iso: string, now: Date = new Date()): number {
  const startOfDay = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const days =
    (startOfDay(parseDate(iso)).getTime() - startOfDay(now).getTime()) /
    86_400_000;
  // El redondeo absorbe la hora de más o de menos de un cambio de horario.
  return Math.round(days);
}

/** "hoy", "1 día", "12 días", "hace 1 día" o "hace 3 días", a partir de `daysUntil`. */
export function formatDaysUntil(days: number): string {
  if (days === 0) return 'hoy';
  const count = Math.abs(days);
  const text = `${count} ${count === 1 ? 'día' : 'días'}`;
  return days < 0 ? `hace ${text}` : text;
}
