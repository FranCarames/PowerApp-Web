import { useState } from 'react';

import type { RoutineAssignedFinished } from '@/api/types';
import { formatDate, toCalendarDay } from '@/shared/lib/dates';
import {
  Button,
  Card,
  Columns,
  ConfirmDialog,
  LinkButton,
  Note,
  SectionHeader,
  Tile,
  useToast,
} from '@/shared/ui';

import {
  useMarkExercise,
  useUnmarkExercise,
} from '../hooks/useExerciseFinished';
import type { ExerciseAccess, RoutineAssignment } from '../routineDetail';
import type { ExerciseLogValues } from '../schemas';
import { ExerciseLogModal } from './ExerciseLogModal';
import styles from './ExerciseLog.module.css';

interface ExerciseLogProps {
  assignment: RoutineAssignment;
  access: ExerciseAccess;
  /** El id del ejercicio en la rutina (`routine_exercise_id`), no el de la ficha del catálogo. */
  routineExerciseId: string;
  /** Lo que el alumno registró del ejercicio, si lo marcó. */
  finished: RoutineAssignedFinished | undefined;
}

const READ_ONLY: Record<Exclude<ExerciseAccess, 'open'>, string> = {
  frozen:
    'Tu entrenador te quitó esta planificación: ya no se puede marcar ni anotar. Podés seguir viendo tus RMs.',
  'plan-pending':
    'Por ahora, los ejercicios de las rutinas del plan se pueden ver, pero todavía no se pueden marcar desde la app.',
};

/**
 * Lo que el alumno hizo del ejercicio (CU-U-12 y CU-U-13): lo marca como hecho (hoy, o el día que
 * elija si lo hizo antes), lo desmarca, y deja o edita su nota, que se guarda con la marca. El
 * cambio se ve al instante y se revierte si el servidor falla. Si la rutina no se puede modificar
 * (la planificación se quitó, o es del plan), solo muestra lo que hizo y por qué no se puede marcar.
 */
export function ExerciseLog({
  assignment,
  access,
  routineExerciseId,
  finished,
}: ExerciseLogProps) {
  const toast = useToast();
  const mark = useMarkExercise(assignment);
  const unmark = useUnmarkExercise(assignment);
  const [logOpen, setLogOpen] = useState(false);
  const [confirmingUnmark, setConfirmingUnmark] = useState(false);

  const note = finished?.user_note ?? null;

  function markToday() {
    mark.mutate(
      { routineExerciseId, finishedAt: toCalendarDay() },
      { onSuccess: () => toast.success('Ejercicio marcado como hecho') },
    );
  }

  function saveLog(values: ExerciseLogValues) {
    setLogOpen(false);
    mark.mutate(
      {
        routineExerciseId,
        finishedAt: values.finished_at,
        // Sin marca y sin texto no hay nota que guardar: se omite y la nota queda como está. Con la
        // marca puesta, el texto vacío es el que borra la nota.
        userNote: finished || values.user_note ? values.user_note : undefined,
      },
      {
        onSuccess: () =>
          toast.success(
            finished ? 'Registro actualizado' : 'Ejercicio marcado como hecho',
          ),
      },
    );
  }

  function unmarkExercise() {
    setConfirmingUnmark(false);
    unmark.mutate(
      { routineExerciseId },
      { onSuccess: () => toast.success('Ejercicio desmarcado') },
    );
  }

  return (
    <section aria-label="Tu registro">
      <SectionHeader title="Tu registro" />
      {finished && (
        <Card row tone="ok" className={styles.done}>
          <Tile icon="check" tone="ok" />
          <span className={styles.doneText}>
            <span className={styles.doneTitle}>Hecho</span>
            <span className={styles.doneDay}>
              Lo hiciste el {formatDate(finished.finished_at)}
            </span>
          </span>
        </Card>
      )}
      {note && (
        <Note tone="acc" icon="note" className={styles.userNote}>
          {note}
        </Note>
      )}

      {access === 'open' ? (
        <>
          <Columns className={styles.actions}>
            <Button variant="sec" icon="note" onClick={() => setLogOpen(true)}>
              {note ? 'Editar nota' : 'Dejar nota'}
            </Button>
            {finished ? (
              <Button
                variant="ghost"
                icon="x"
                onClick={() =>
                  note ? setConfirmingUnmark(true) : unmarkExercise()
                }
              >
                Desmarcar
              </Button>
            ) : (
              <Button icon="check" onClick={markToday}>
                Marcar hecho
              </Button>
            )}
          </Columns>
          <p className={styles.other}>
            <LinkButton onClick={() => setLogOpen(true)}>
              {finished ? 'Cambiar el día' : 'Lo hice otro día'}
            </LinkButton>
          </p>
          <ExerciseLogModal
            open={logOpen}
            finished={finished}
            onSubmit={saveLog}
            onClose={() => setLogOpen(false)}
          />
          <ConfirmDialog
            open={confirmingUnmark}
            destructive
            title="Desmarcar el ejercicio"
            message="Se borra también la nota que dejaste. ¿Querés desmarcarlo?"
            confirmLabel="Desmarcar"
            onConfirm={unmarkExercise}
            onCancel={() => setConfirmingUnmark(false)}
          />
        </>
      ) : (
        <Note tone={access === 'frozen' ? 'warn' : 'acc'} icon="alert">
          {READ_ONLY[access]}
        </Note>
      )}
    </section>
  );
}
