import { useMemo } from 'react';

import { getErrorMessage } from '@/api/errors';
import { useUserPayments } from '@/features/account/hooks/useUserPayments';
import { formatDate } from '@/shared/lib/dates';
import { formatPrice } from '@/shared/lib/format';
import { newestPaymentsFirst } from '@/shared/lib/membershipStatus';
import {
  Button,
  EmptyState,
  ErrorState,
  Modal,
  Skeleton,
  VisuallyHidden,
} from '@/shared/ui';

import styles from './StudentPaymentsModal.module.css';

interface StudentPaymentsModalProps {
  studentId: string;
  open: boolean;
  onClose: () => void;
}

/**
 * El historial de pagos de un alumno (CU-E-05), en un modal: del más reciente al más antiguo, con la
 * fecha de pago y el vencimiento (`expired_at`) de cada uno. Comparte la query con los datos del
 * detalle, así que no vuelve a pedirlos.
 */
export function StudentPaymentsModal({
  studentId,
  open,
  onClose,
}: StudentPaymentsModalProps) {
  const query = useUserPayments(studentId);
  const payments = useMemo(
    () => (query.data ? newestPaymentsFirst(query.data) : []),
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
        <VisuallyHidden role="status">Cargando los pagos…</VisuallyHidden>
        <Skeleton height={56} radius={8} />
        <Skeleton height={56} radius={8} />
      </div>
    );
  } else if (payments.length === 0) {
    content = (
      <EmptyState
        icon="wallet"
        title="Todavía no tiene pagos"
        message="Cuando registres un pago, lo vas a ver acá."
      />
    );
  } else {
    content = (
      <ul className={styles.rows}>
        {payments.map((payment) => (
          <li key={payment.id} className={styles.row}>
            <span className={styles.info}>
              <span className={styles.name}>{payment.name}</span>
              <span className={styles.line}>
                Pagado el {formatDate(payment.created_at)}
              </span>
              <span className={styles.line}>
                Vence el {formatDate(payment.expired_at)}
              </span>
            </span>
            <span className={styles.price}>{formatPrice(payment.price)}</span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Historial de pagos"
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
