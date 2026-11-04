import type { RoutineHistorySession } from '@/api/types';
import {
  formatShortDay,
  sessionOrigin,
  toDay,
  type Day,
} from '@/shared/lib/trainingHistory';
import { Card } from '@/shared/ui';

import styles from './HistoryDayCard.module.css';
import { HistoryExerciseItem } from './HistoryExerciseItem';
import { SessionSourcePill } from './SessionSourcePill';

interface HistoryDayCardProps {
  session: RoutineHistorySession;
  /** El día elegido del calendario. */
  day: Day;
  today: Day;
  onOpenExercise: (exerciseId: string) => void;
}

/**
 * Una sesión en el día elegido del calendario (7.3): solo los ejercicios hechos ese día, sin plegarse.
 * Si la sesión empezó otro día, la línea lo dice («· empezó el 2 nov»).
 */
export function HistoryDayCard({
  session,
  day,
  today,
  onOpenExercise,
}: HistoryDayCardProps) {
  return (
    <Card className={styles.card}>
      <div className={styles.head}>
        <div className={styles.info}>
          <h3 className={styles.routine}>{session.routine.name}</h3>
          <div className={styles.sub}>
            {sessionOrigin(session)}
            {session.date !== day &&
              ` · empezó el ${formatShortDay(session.date, today)}`}
          </div>
        </div>
        <SessionSourcePill session={session} />
      </div>
      <ul className={styles.exercises}>
        {session.exercises
          .filter(({ finished_at }) => toDay(finished_at) === day)
          .map((exercise) => (
            <HistoryExerciseItem
              key={exercise.routine_exercise_id}
              exercise={exercise}
              showDoneOn={false}
              today={today}
              onOpenExercise={onOpenExercise}
            />
          ))}
      </ul>
    </Card>
  );
}
