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

/**
 * "15 Jul 2026", a partir de una fecha ISO, en el día local de quien la mira. Una fecha sin hora es
 * un día del calendario y se muestra tal cual, sin correrla por la zona horaria.
 */
export function formatDate(iso: string): string {
  const dateOnly = DATE_ONLY.exec(iso);
  const date = dateOnly
    ? new Date(
        Number(dateOnly[1]),
        Number(dateOnly[2]) - 1,
        Number(dateOnly[3]),
      )
    : new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getDate()} ${SHORT_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}
