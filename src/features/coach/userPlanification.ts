import type { UserPlanificationAssignment } from '@/api/types';
import { toCalendarDay } from '@/shared/lib/dates';
import type { Tone } from '@/shared/ui/tone';

/**
 * En qué está una planificación asignada a un alumno. El backend no manda un estado calculado: salvo
 * `active` (quitada), se deduce de las fechas, que son días de calendario (`YYYY-MM-DD`) y se comparan
 * como texto.
 */
export type AssignmentStatus = 'current' | 'upcoming' | 'finished' | 'removed';

export function assignmentStatus(
  { active, start_date, end_date }: UserPlanificationAssignment,
  today: string = toCalendarDay(),
): AssignmentStatus {
  if (!active) return 'removed';
  if (today < start_date) return 'upcoming';
  if (today > end_date) return 'finished';
  return 'current';
}

export const ASSIGNMENT_STATUS_LABEL: Record<AssignmentStatus, string> = {
  current: 'Vigente',
  upcoming: 'Próxima',
  finished: 'Terminada',
  removed: 'Quitada',
};

export const ASSIGNMENT_STATUS_TONE: Record<AssignmentStatus, Tone | 'mut'> = {
  current: 'ok',
  upcoming: 'acc',
  finished: 'mut',
  removed: 'warn',
};
