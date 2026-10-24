import type {
  RoutineHistoryExercise,
  RoutineHistorySession,
} from '@/api/types';
import { formatDate } from '@/shared/lib/dates';
import { formatSetBlock } from '@/shared/lib/sets';
import { Card, Pill } from '@/shared/ui';

import styles from './HistorySessionCard.module.css';

/**
 * De dónde viene la sesión: CU-E-06 pide que cada una lo diga. Las del plan (BE-20d) suman su semana; el
 * nombre de la plantilla va debajo del día, porque lo escribe el entrenador y puede ser largo.
 */
function originLabel(session: RoutineHistorySession): string {
  return session.source === 'plan'
    ? `Plan · Semana ${session.week}`
    : 'Individual';
}

function HistoryExerciseItem({
  exercise,
  sessionDate,
}: {
  exercise: RoutineHistoryExercise;
  sessionDate: string;
}) {
  const { sets, user_note: note } = exercise;

  return (
    <li className={styles.exercise}>
      <div className={styles.exerciseHead}>
        <h4 className={styles.exerciseName}>{exercise.exercise.name}</h4>
        {/* El día de la sesión ya está arriba: solo se aclara el de un ejercicio que se hizo otro día (marcado en diferido). */}
        {exercise.finished_at !== sessionDate && (
          <time className={styles.doneOn} dateTime={exercise.finished_at}>
            Hecho el {formatDate(exercise.finished_at)}
          </time>
        )}
      </div>
      {sets.length === 0 ? (
        <p className={styles.noSets}>La rutina no tiene series cargadas.</p>
      ) : (
        // Son las series de la rutina como están hoy, no lo que levantó el alumno: el rótulo lo aclara
        // en cada ejercicio, porque la nota de arriba se pierde al hacer scroll.
        <div className={styles.sets}>
          <span className={styles.label}>Prescripto</span>
          <ul className={styles.blocks}>
            {sets.map((set) => (
              <li key={set.set_order} className={styles.block}>
                {formatSetBlock(set)}
              </li>
            ))}
          </ul>
        </div>
      )}
      {note && (
        <p className={styles.userNote}>
          <span className={styles.label}>Nota del alumno</span>
          <span className={styles.noteText}>{note}</span>
        </p>
      )}
    </li>
  );
}

/**
 * Una sesión del historial (CU-E-06 y CU-E-07): la rutina con su día y de dónde viene, y los ejercicios que
 * el alumno hizo en ella, en el orden en que los manda el backend (por el día en que los hizo).
 */
export function HistorySessionCard({
  session,
}: {
  session: RoutineHistorySession;
}) {
  return (
    <Card className={styles.session}>
      <header className={styles.head}>
        <div className={styles.title}>
          <h3 className={styles.routine}>{session.routine.name}</h3>
          <time className={styles.date} dateTime={session.date}>
            {formatDate(session.date)}
          </time>
          {session.source === 'plan' && session.planification.name && (
            <span className={styles.date}>{session.planification.name}</span>
          )}
        </div>
        <Pill>{originLabel(session)}</Pill>
      </header>
      <ul className={styles.exercises}>
        {session.exercises.map((exercise) => (
          <HistoryExerciseItem
            key={exercise.routine_exercise_id}
            exercise={exercise}
            sessionDate={session.date}
          />
        ))}
      </ul>
    </Card>
  );
}
