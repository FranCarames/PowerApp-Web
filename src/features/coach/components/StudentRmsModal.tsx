import { useMemo } from 'react';

import { getErrorMessage } from '@/api/errors';
import { useUserRms } from '@/features/account/hooks/useUserRms';
import { formatDate } from '@/shared/lib/dates';
import { formatWeight } from '@/shared/lib/format';
import { groupRmsByExercise } from '@/shared/lib/rms';
import {
  Button,
  EmptyState,
  ErrorState,
  Modal,
  SectionHeader,
  Skeleton,
  VisuallyHidden,
} from '@/shared/ui';

import styles from './StudentRmsModal.module.css';

interface StudentRmsModalProps {
  studentId: string;
  studentName: string;
  open: boolean;
  onClose: () => void;
}

/**
 * Los RMs registrados de un alumno, agrupados por ejercicio (CU-E-04), en un modal. Cada RM trae su
 * ejercicio, con el nombre. Es de solo lectura: los RMs los carga el propio alumno.
 */
export function StudentRmsModal({
  studentId,
  studentName,
  open,
  onClose,
}: StudentRmsModalProps) {
  // Se piden al abrir el modal, no al entrar al detalle.
  const query = useUserRms(studentId, open);
  const groups = useMemo(
    () => (query.data ? groupRmsByExercise(query.data) : []),
    [query.data],
  );

  let content;
  if (query.isError) {
    content = (
      <ErrorState
        message={getErrorMessage(query.error)}
        onRetry={() => void query.refetch()}
        retrying={query.isRefetching}
      />
    );
  } else if (query.isPending) {
    content = (
      <div aria-busy="true">
        <VisuallyHidden role="status">Cargando los RMs…</VisuallyHidden>
        <Skeleton width="40%" height={12} />
        <Skeleton height={44} radius={8} />
        <Skeleton height={44} radius={8} />
      </div>
    );
  } else if (groups.length === 0) {
    content = (
      <EmptyState
        icon="trophy"
        title="Todavía no registró RMs"
        message="Los RMs los carga el propio alumno desde su cuenta."
      />
    );
  } else {
    content = groups.map(({ exerciseId, name, rms }) => (
      <section key={exerciseId} className={styles.group}>
        <SectionHeader title={name} level={3} />
        <ul className={styles.rows}>
          {rms.map((rm) => (
            <li key={rm.id} className={styles.row}>
              <span className={styles.value}>
                {formatWeight(rm.weight)} · {rm.reps}{' '}
                {rm.reps === 1 ? 'rep' : 'reps'}
              </span>
              <span className={styles.date}>{formatDate(rm.date)}</span>
            </li>
          ))}
        </ul>
      </section>
    ));
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`RMs de ${studentName}`}
      actions={
        <Button variant="ghost" onClick={onClose}>
          Cerrar
        </Button>
      }
    >
      {content}
    </Modal>
  );
}
