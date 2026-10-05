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

/** "15 Jul 2026", a partir de una fecha ISO, en el día local de quien la mira. */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getDate()} ${SHORT_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}
