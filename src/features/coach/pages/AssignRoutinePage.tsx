import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';

import { getErrorMessage, isApiError } from '@/api/errors';
import type { User } from '@/api/types';
import { useRoutine } from '@/features/catalog/hooks/useRoutines';
import { RESTORE_DRAFT_STATE } from '@/features/catalog/routineDraft';
import {
  Button,
  ErrorState,
  ListItem,
  Note,
  PageHeader,
  Skeleton,
  VisuallyHidden,
} from '@/shared/ui';

import { AssignLayout } from '../components/AssignLayout';
import { AssignRoutineForm } from '../components/AssignRoutineForm';
import { StudentPicker } from '../components/StudentPicker';
import styles from './AssignRoutinePage.module.css';

const LIST = '/c/rutinas';

/**
 * Asignar una rutina puntual a un alumno desde la rutina (CU-E-19), en `/c/rutinas/:id/asignar`: la rutina
 * ya viene elegida (el "Asignar a alumno" de su editor) y se elige al alumno y el día en que la hace. Solo
 * se asigna una rutina vigente, y a un alumno con la cuenta abierta.
 *
 * El editor guardó lo escrito sin guardar antes de salir: "Volver" y el aviso de que se asignó vuelven a él
 * con `RESTORE_DRAFT_STATE`, para que lo recupere.
 */
export function AssignRoutinePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const routine = useRoutine(id ?? null);
  const [student, setStudent] = useState<User | null>(null);
  const editor = `${LIST}/${id}`;

  // Un id que no es un UUID da 400 y uno que no existe, 404.
  const notFound =
    isApiError(routine.error) &&
    (routine.error.status === 404 || routine.error.status === 400);

  if (!routine.data) {
    return (
      <>
        <PageHeader
          eyebrow="Rutina"
          title="Asignar a un alumno"
          back={notFound ? LIST : editor}
          backState={notFound ? undefined : RESTORE_DRAFT_STATE}
        />
        {notFound ? (
          <ErrorState
            title="No encontramos la rutina"
            message="No hay ninguna rutina con ese enlace. Volvé a la lista."
          />
        ) : routine.isError ? (
          <ErrorState
            message={getErrorMessage(routine.error)}
            onRetry={() => void routine.refetch()}
            retrying={routine.isRefetching}
          />
        ) : (
          <div aria-busy="true">
            <VisuallyHidden role="status">Cargando la rutina…</VisuallyHidden>
            <Skeleton height={68} radius={16} className={styles.skeleton} />
            <Skeleton height={68} radius={16} />
          </div>
        )}
      </>
    );
  }

  const { name, coach_note, active, circuits } = routine.data;
  const blocked = !active
    ? 'Esta rutina está dada de baja: no se ofrece para asignaciones nuevas. Reactivala desde su editor para asignarla.'
    : null;

  return (
    <AssignLayout
      eyebrow={`Rutina · ${name}`}
      title="Asignar a un alumno"
      back={editor}
      backState={RESTORE_DRAFT_STATE}
      notice={
        blocked && (
          <Note tone="warn" icon="alert" className={styles.note}>
            {blocked}
          </Note>
        )
      }
      fixed={{
        label: 'Rutina',
        content: (
          <ListItem
            title={name}
            // El backend manda `null` en la nota que no tiene, aunque el contrato la declara opcional.
            subtitle={coach_note || undefined}
            meta={
              circuits.length === 0
                ? 'Sin circuitos'
                : `${circuits.length} circuito${circuits.length === 1 ? '' : 's'}`
            }
            trailing={
              blocked ? (
                <Button sm variant="ghost" onClick={() => navigate(editor)}>
                  Abrir editor
                </Button>
              ) : undefined
            }
          />
        ),
      }}
      choice={
        blocked
          ? undefined
          : {
              label: 'Alumno',
              content: (
                <StudentPicker
                  activeOnly
                  student={student}
                  onChange={setStudent}
                />
              ),
            }
      }
    >
      {!blocked &&
        (student ? (
          <AssignRoutineForm
            key={student.id}
            routine={routine.data}
            student={student}
            returnTo={editor}
            returnState={RESTORE_DRAFT_STATE}
          />
        ) : (
          <p className={styles.hint}>Elegí un alumno para indicar el día.</p>
        ))}
    </AssignLayout>
  );
}
