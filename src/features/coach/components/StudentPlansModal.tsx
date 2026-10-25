import { useState } from 'react';

import { getErrorMessage } from '@/api/errors';
import type { UserPlanificationAssignment } from '@/api/types';
import { useUserPlanifications } from '@/features/account/hooks/useUserPlanifications';
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

import { useSetUserPlanificationActive } from '../hooks/useSetUserPlanificationActive';
import styles from './StudentPlansModal.module.css';
import { UserPlanificationCard } from './UserPlanificationCard';

interface StudentPlansModalProps {
  studentId: string;
  studentName: string;
  /** Si la cuenta está abierta: a una cerrada no se le asigna una planificación (el backend responde 400). */
  studentActive: boolean;
  open: boolean;
  onClose: () => void;
  /** Ir a asignarle una planificación (CU-E-13). */
  onAssign: () => void;
}

/**
 * Las planificaciones de un alumno (CU-E-14, paso 1), en un modal: de la más nueva a la más vieja, cada
 * una con su estado, sus fechas y su nota. Por defecto se ven las que no se quitaron (incluidas las ya
 * terminadas y las próximas); "Incluir quitadas" suma las dadas de baja. Se quita una (baja lógica, con
 * confirmación) o se reincorpora una quitada con sus mismas fechas, y desde acá se va a asignar otra.
 * Comparte la query con los datos del detalle del alumno.
 */
export function StudentPlansModal({
  studentId,
  studentName,
  studentActive,
  open,
  onClose,
  onAssign,
}: StudentPlansModalProps) {
  const toast = useToast();
  // Una sola lista con las quitadas incluidas: el chip filtra sin volver a pedirla.
  const query = useUserPlanifications(studentId, { includeInactive: true });
  const setActive = useSetUserPlanificationActive();
  const [includeRemoved, setIncludeRemoved] = useState(false);
  const [removing, setRemoving] = useState<UserPlanificationAssignment | null>(
    null,
  );

  const hasRemoved = query.data?.some(({ active }) => !active) ?? false;
  const shown = query.data?.filter(({ active }) => active || includeRemoved);

  function changeActive(target: UserPlanificationAssignment, active: boolean) {
    setActive.mutate(
      { id: target.id, active },
      {
        onSuccess: () => {
          toast.success(
            active ? 'Planificación reincorporada' : 'Planificación quitada',
          );
          setRemoving(null);
        },
        onError: (error) => {
          toast.error(
            getErrorMessage(error, {
              400: active
                ? 'Esa planificación ya estaba activa.'
                : 'Esa planificación ya estaba quitada.',
              404: 'Esa planificación ya no existe.',
            }),
          );
          setRemoving(null);
        },
      },
    );
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
        <VisuallyHidden role="status">
          Cargando las planificaciones…
        </VisuallyHidden>
        <Skeleton height={84} radius={16} />
        <Skeleton height={84} radius={16} />
      </div>
    );
  } else if (shown.length === 0) {
    content = (
      <EmptyState
        icon="calendar"
        title={
          query.data?.length
            ? 'No tiene planificaciones activas'
            : 'Sin planificaciones'
        }
        message={
          query.data?.length
            ? 'Las que se quitaron se ven con “Incluir quitadas”.'
            : 'Todavía no le asignaste ninguna planificación.'
        }
      />
    );
  } else {
    content = (
      <div className={styles.list}>
        {shown.map((assignment) => (
          <UserPlanificationCard
            key={assignment.id}
            assignment={assignment}
            action={
              assignment.active ? (
                <Button
                  sm
                  variant="ghost"
                  aria-label={`Quitar ${assignment.planification.name || 'la planificación'}`}
                  onClick={() => setRemoving(assignment)}
                >
                  Quitar
                </Button>
              ) : (
                <Button
                  sm
                  variant="sec"
                  aria-label={`Reincorporar ${assignment.planification.name || 'la planificación'}`}
                  loading={
                    setActive.isPending &&
                    setActive.variables.id === assignment.id
                  }
                  onClick={() => changeActive(assignment, true)}
                >
                  Reincorporar
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
        title="Planificaciones"
        description={
          <>
            Las de <b>{studentName}</b>, de la más nueva a la más vieja.
          </>
        }
        actions={
          <>
            {studentActive && (
              <Button onClick={onAssign}>Asignar planificación</Button>
            )}
            <Button variant="ghost" onClick={onClose}>
              Cerrar
            </Button>
          </>
        }
      >
        {!studentActive && (
          <Note tone="warn" icon="alert" className={styles.note}>
            La cuenta está inactiva: reactivala para asignarle una
            planificación.
          </Note>
        )}
        {hasRemoved && (
          <ChipGroup aria-label="Filtrar planificaciones">
            <Chip
              tone="acc"
              selected={includeRemoved}
              onClick={() => setIncludeRemoved(!includeRemoved)}
            >
              Incluir quitadas
            </Chip>
          </ChipGroup>
        )}
        {content}
      </Modal>
      <ConfirmDialog
        open={removing !== null}
        destructive
        title="Quitar planificación"
        message={
          <>
            <b>{removing?.planification.name || 'La planificación'}</b> deja de
            verse en el home de <b>{studentName}</b>, que ya no puede marcar ni
            anotar en ella. Es una baja lógica: lo que entrenó se conserva y la
            podés reincorporar cuando quieras.
          </>
        }
        confirmLabel="Quitar"
        loading={setActive.isPending}
        onConfirm={() => removing && changeActive(removing, false)}
        onCancel={() => setRemoving(null)}
      />
    </>
  );
}
