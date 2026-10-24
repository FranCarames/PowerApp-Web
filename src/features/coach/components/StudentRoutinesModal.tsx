import { useState } from 'react';

import { getErrorMessage } from '@/api/errors';
import type { RoutineAssignedListItem } from '@/api/types';
import { formatDate } from '@/shared/lib/dates';
import {
  Button,
  Chip,
  ChipGroup,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Modal,
  Note,
  Skeleton,
  useToast,
  VisuallyHidden,
} from '@/shared/ui';

import {
  assignedRoutineWhen,
  isTrained,
  sortAssignedRoutines,
} from '../assignedRoutine';
import { removeAssignedRoutineErrorMessage } from '../assignRoutineErrors';
import { useAssignedRoutines } from '../hooks/useAssignedRoutines';
import { useRemoveAssignedRoutine } from '../hooks/useRemoveAssignedRoutine';
import { AssignedRoutineCard } from './AssignedRoutineCard';
import styles from './StudentRoutinesModal.module.css';

interface StudentRoutinesModalProps {
  studentId: string;
  studentName: string;
  /** Si la cuenta está abierta: a una cerrada no se le asigna una rutina (el backend responde 400). */
  studentActive: boolean;
  open: boolean;
  onClose: () => void;
  /** Ir a asignarle una rutina (CU-E-19). */
  onAssign: () => void;
}

/**
 * Las rutinas puntuales de un alumno (CU-E-20, paso 1), en un modal: las asignadas para un día, cada una
 * con su día, cuánto avanzó el alumno y, si no la entrenó, Quitar. Por defecto se ven las de hoy y las que
 * vienen; "Incluir anteriores" suma las pasadas, de la más reciente a la más vieja. Quitar es un borrado
 * **físico** con confirmación: no se reincorpora, se asigna de nuevo. Una rutina que el alumno ya entrenó
 * no se puede quitar (409): no ofrece Quitar, y si se entrenó mientras se miraba la lista, el aviso lo dice.
 */
export function StudentRoutinesModal({
  studentId,
  studentName,
  studentActive,
  open,
  onClose,
  onAssign,
}: StudentRoutinesModalProps) {
  const toast = useToast();
  // Una sola lista con las anteriores incluidas: el chip filtra sin volver a pedirla. Se pide al abrir el
  // modal (y de nuevo al reabrirlo si ya pasó el tiempo de frescura), no al abrir el detalle del alumno.
  const query = useAssignedRoutines(studentId, { enabled: open });
  const remove = useRemoveAssignedRoutine();
  const [includePast, setIncludePast] = useState(false);
  const [removing, setRemoving] = useState<RoutineAssignedListItem | null>(
    null,
  );

  const sorted = query.data && sortAssignedRoutines(query.data);
  const hasPast =
    sorted?.some((item) => assignedRoutineWhen(item) === 'past') ?? false;
  const shown = sorted?.filter(
    (item) => includePast || assignedRoutineWhen(item) !== 'past',
  );

  function confirmRemove(target: RoutineAssignedListItem) {
    remove.mutate(target.id, {
      onSuccess: () => {
        toast.success('Rutina quitada');
        setRemoving(null);
      },
      onError: (error) => {
        toast.error(removeAssignedRoutineErrorMessage(error));
        setRemoving(null);
      },
    });
  }

  let content;
  if (query.isError) {
    content = (
      <ErrorState
        message={getErrorMessage(query.error)}
        onRetry={() => void query.refetch()}
        retrying={query.isRefetching}
      />
    );
  } else if (!shown) {
    content = (
      <div aria-busy="true">
        <VisuallyHidden role="status">Cargando las rutinas…</VisuallyHidden>
        <Skeleton height={104} radius={16} />
        <Skeleton height={104} radius={16} />
      </div>
    );
  } else if (shown.length === 0) {
    content = (
      <EmptyState
        icon="list"
        title={
          query.data?.length
            ? 'No tiene rutinas para hoy ni próximas'
            : 'Sin rutinas puntuales'
        }
        message={
          query.data?.length
            ? 'Las anteriores se ven con “Incluir anteriores”.'
            : 'Todavía no le asignaste ninguna rutina para un día.'
        }
      />
    );
  } else {
    content = (
      <div className={styles.list}>
        {shown.map((assignment) => (
          <AssignedRoutineCard
            key={assignment.id}
            assignment={assignment}
            action={
              isTrained(assignment) ? (
                <span className={styles.trained}>
                  Ya la entrenó: no se puede quitar
                </span>
              ) : (
                <Button
                  sm
                  variant="ghost"
                  aria-label={`Quitar ${assignment.routine.name} del ${formatDate(assignment.date)}`}
                  onClick={() => setRemoving(assignment)}
                >
                  Quitar
                </Button>
              )
            }
          />
        ))}
      </div>
    );
  }

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title="Rutinas puntuales"
        description={
          <>
            Las que le asignaste a <b>{studentName}</b> para un día.
          </>
        }
        actions={
          <>
            {studentActive && (
              <Button onClick={onAssign}>Asignar rutina</Button>
            )}
            <Button variant="ghost" onClick={onClose}>
              Cerrar
            </Button>
          </>
        }
      >
        {!studentActive && (
          <Note tone="warn" icon="alert" className={styles.note}>
            La cuenta está inactiva: reactivala para asignarle una rutina.
          </Note>
        )}
        {hasPast && (
          <ChipGroup aria-label="Filtrar rutinas">
            <Chip
              tone="acc"
              selected={includePast}
              onClick={() => setIncludePast(!includePast)}
            >
              Incluir anteriores
            </Chip>
          </ChipGroup>
        )}
        {content}
      </Modal>
      <ConfirmDialog
        open={removing !== null}
        destructive
        title="Quitar rutina"
        message={
          <>
            <b>{removing?.routine.name}</b> del{' '}
            <b>{removing && formatDate(removing.date)}</b> deja de verse en el
            home de <b>{studentName}</b>. Es un borrado definitivo, no una baja
            lógica: la asignación no se puede reincorporar, habría que asignarla
            de nuevo. Si el alumno ya la entrenó, no se puede quitar.
          </>
        }
        confirmLabel="Quitar"
        loading={remove.isPending}
        onConfirm={() => removing && confirmRemove(removing)}
        onCancel={() => setRemoving(null)}
      />
    </>
  );
}
