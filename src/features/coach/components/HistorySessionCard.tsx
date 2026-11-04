import type { RoutineHistorySession } from '@/api/types';
import { Icon } from '@/shared/icons';
import {
  doneOnAnotherDay,
  plural,
  sessionId,
  sessionOrigin,
  type Day,
} from '@/shared/lib/trainingHistory';
import { Card } from '@/shared/ui';

import { HistoryDayBadge } from './HistoryDayBadge';
import { HistoryExerciseItem } from './HistoryExerciseItem';
import styles from './HistorySessionCard.module.css';
import { SessionSourcePill } from './SessionSourcePill';

interface HistorySessionCardProps {
  session: RoutineHistorySession;
  open: boolean;
  onToggle: () => void;
  today: Day;
  onOpenExercise: (exerciseId: string) => void;
}

/**
 * Una sesión de la lista (6.4), plegable: el encabezado es un botón con el día, la rutina, de dónde viene
 * y cuántos ejercicios y notas tiene. Abierta, muestra los ejercicios hechos en el orden del backend.
 */
export function HistorySessionCard({
  session,
  open,
  onToggle,
  today,
  onOpenExercise,
}: HistorySessionCardProps) {
  const listId = `historial-${sessionId(session)}`;
  const notes = session.exercises.filter(({ user_note }) =>
    user_note?.trim(),
  ).length;

  return (
    <Card className={styles.card}>
      <button
        type="button"
        className={styles.head}
        aria-expanded={open}
        aria-controls={listId}
        onClick={onToggle}
      >
        <HistoryDayBadge day={session.date} />
        <span className={styles.info}>
          <span className={styles.routine}>{session.routine.name}</span>
          <span className={styles.sub}>{sessionOrigin(session)}</span>
          <span className={styles.sub}>
            {plural(session.exercises.length, 'ejercicio', 'ejercicios')}
            {notes > 0 && ` · ${plural(notes, 'nota', 'notas')}`}
          </span>
        </span>
        <span className={styles.end}>
          <SessionSourcePill session={session} />
          <Icon name={open ? 'chevU' : 'chevD'} size={18} />
        </span>
      </button>
      <ul id={listId} className={styles.exercises} hidden={!open}>
        {session.exercises.map((exercise) => (
          <HistoryExerciseItem
            key={exercise.routine_exercise_id}
            exercise={exercise}
            showDoneOn={doneOnAnotherDay(exercise, session.date)}
            today={today}
            onOpenExercise={onOpenExercise}
          />
        ))}
      </ul>
    </Card>
  );
}
