import { useLocation, useNavigate } from 'react-router';

import type { RoutineAssignedFinished } from '@/api/types';
import { cx } from '@/shared/lib/cx';
import { formatDate } from '@/shared/lib/dates';
import { formatSetBlock } from '@/shared/lib/sets';
import { ListItem, Pill, Thumb } from '@/shared/ui';

import type { RoutineExercise } from '../routineDetail';
import styles from './RoutineExerciseRow.module.css';

interface RoutineExerciseRowProps {
  exercise: RoutineExercise;
  /** El detalle del ejercicio, al que lleva la fila. */
  to: string;
  /** Lo que el alumno hizo de este ejercicio en la asignación, si lo hizo. */
  finished?: RoutineAssignedFinished;
}

/**
 * Un ejercicio de la rutina del alumno: su foto, su nombre y sus series, una línea por bloque ("3×8 ·
 * 80 kg · RPE 7"). Si lo hizo, la fila se apaga y dice el día y su nota. Tocarla abre el detalle del
 * ejercicio (CU-U-10), y le pasa el `state` de la navegación para que "Volver" siga dejando el home en la
 * misma semana.
 */
export function RoutineExerciseRow({
  exercise,
  to,
  finished,
}: RoutineExerciseRowProps) {
  const navigate = useNavigate();
  const { state } = useLocation();
  const blocks = [...exercise.sets].sort((a, b) => a.set_order - b.set_order);

  return (
    <ListItem
      className={finished ? styles.done : undefined}
      onClick={() => void navigate(to, { state })}
      chevron
      leading={<Thumb src={exercise.exercise.preview_image} />}
      title={<span className={styles.name}>{exercise.exercise.name}</span>}
      subtitle={
        <>
          {blocks.length === 0 ? (
            <span className={styles.line}>Sin series cargadas</span>
          ) : (
            blocks.map((block) => (
              <span key={block.id} className={styles.line}>
                {formatSetBlock(block)}
              </span>
            ))
          )}
          {finished?.user_note && (
            <span className={cx(styles.line, styles.note)}>
              “{finished.user_note}”
            </span>
          )}
        </>
      }
      meta={finished && `Hecho el ${formatDate(finished.finished_at)}`}
      trailing={finished && <Pill tone="ok">Hecho</Pill>}
    />
  );
}
