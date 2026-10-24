import type { RoutineAssignedListItem } from '@/api/types';
import { toCalendarDay } from '@/shared/lib/dates';
import type { Tone } from '@/shared/ui/tone';

/**
 * Cuándo es una rutina puntual de un alumno, respecto de hoy. El día es de calendario (`YYYY-MM-DD`) y se
 * compara como texto.
 */
export type AssignedRoutineWhen = 'today' | 'upcoming' | 'past';

export function assignedRoutineWhen(
  { date }: Pick<RoutineAssignedListItem, 'date'>,
  today: string = toCalendarDay(),
): AssignedRoutineWhen {
  if (date === today) return 'today';
  return date > today ? 'upcoming' : 'past';
}

export const ASSIGNED_WHEN_LABEL: Record<AssignedRoutineWhen, string> = {
  today: 'Hoy',
  upcoming: 'Próxima',
  past: 'Pasada',
};

export const ASSIGNED_WHEN_TONE: Record<AssignedRoutineWhen, Tone | 'mut'> = {
  today: 'ok',
  upcoming: 'acc',
  past: 'mut',
};

/**
 * Si el alumno ya entrenó la rutina: marcó al menos un ejercicio. Es lo mismo que mira el backend para no
 * dejar quitarla (409), así que una entrenada no ofrece Quitar.
 */
export function isTrained({ progress }: RoutineAssignedListItem): boolean {
  return progress.finished > 0;
}

/**
 * Las rutinas puntuales de un alumno como las quiere ver el entrenador: hoy y las que vienen primero, de la
 * más cercana a la más lejana, y después las pasadas, de la más reciente a la más vieja. Con el mismo día,
 * por nombre de rutina. El backend las manda de la más vieja a la más nueva.
 */
export function sortAssignedRoutines(
  items: RoutineAssignedListItem[],
  today: string = toCalendarDay(),
): RoutineAssignedListItem[] {
  const byName = (a: RoutineAssignedListItem, b: RoutineAssignedListItem) =>
    a.routine.name.localeCompare(b.routine.name, 'es');
  const ahead = items
    .filter(({ date }) => date >= today)
    .sort((a, b) => a.date.localeCompare(b.date) || byName(a, b));
  const past = items
    .filter(({ date }) => date < today)
    .sort((a, b) => b.date.localeCompare(a.date) || byName(a, b));
  return [...ahead, ...past];
}
