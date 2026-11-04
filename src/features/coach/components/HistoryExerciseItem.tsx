import type { RoutineHistoryExercise } from '@/api/types';
import { formatShortDay, toDay, type Day } from '@/shared/lib/trainingHistory';

import { HistoryNote } from './HistoryNote';
import { HistoryPrescription } from './HistoryPrescription';
import styles from './HistoryExerciseItem.module.css';

interface HistoryExerciseItemProps {
  exercise: RoutineHistoryExercise;
  /** «Hecho el 4 nov» debajo: si lo hizo otro día que la fecha de la sesión. */
  showDoneOn: boolean;
  today: Day;
  /** El nombre abre el detalle del ejercicio (CU-E-07, paso 1). */
  onOpenExercise: (exerciseId: string) => void;
}

/** Un ejercicio hecho en una sesión (6.4): el nombre, la prescripción y la nota del alumno. */
export function HistoryExerciseItem({
  exercise,
  showDoneOn,
  today,
  onOpenExercise,
}: HistoryExerciseItemProps) {
  const note = exercise.user_note?.trim();

  return (
    <li className={styles.item}>
      <div className={styles.row}>
        <button
          type="button"
          className={styles.name}
          onClick={() => onOpenExercise(exercise.exercise.id)}
        >
          {exercise.exercise.name}
        </button>
        <HistoryPrescription sets={exercise.sets} />
      </div>
      {showDoneOn && (
        <div className={styles.doneOn}>
          Hecho el {formatShortDay(toDay(exercise.finished_at), today)}
        </div>
      )}
      {note && <HistoryNote note={note} />}
    </li>
  );
}
