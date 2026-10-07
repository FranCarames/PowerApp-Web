import { useNavigate } from 'react-router';

import type { StudentMembership } from '@/api/pending';
import { cx } from '@/shared/lib/cx';
import { daysUntil, formatDate, formatDaysUntil } from '@/shared/lib/dates';
import { fullName } from '@/shared/lib/fullName';
import {
  MEMBERSHIP_STATUS_LABEL,
  MEMBERSHIP_STATUS_TONE,
} from '@/shared/lib/membershipStatus';
import { Avatar, Button, Card, Pill } from '@/shared/ui';

import styles from './MembershipRow.module.css';

/**
 * Un alumno del control de membresías: su estado, el tipo y el vencimiento de su último pago y la
 * acción de registrar un pago (o renovar, si ya venció), que abre el registro con él elegido. Abajo
 * dice cuándo vence ("15 Jul 2026 · 12 días") o, si ya venció, desde cuándo. Un alumno que nunca
 * pagó no tiene vencimiento.
 */
export function MembershipRow({ student }: { student: StudentMembership }) {
  const navigate = useNavigate();
  const name = fullName(student);
  const status = student.membership_status;
  const expired = status === 'expired';

  return (
    <Card className={styles.card}>
      <div className={styles.head}>
        <Avatar
          name={name}
          size={40}
          tone={expired || status === 'no_payments' ? 'gray' : 'pri'}
        />
        <div className={styles.who}>
          <div className={styles.name}>{name}</div>
          <div className={styles.sub}>
            {student.membership_name ?? 'Sin membresía'}
          </div>
        </div>
        <Pill tone={MEMBERSHIP_STATUS_TONE[status]}>
          {MEMBERSHIP_STATUS_LABEL[status]}
        </Pill>
      </div>
      <div className={styles.foot}>
        <div>
          {student.expired_at ? (
            <>
              <div className={styles.label}>{expired ? 'Venció' : 'Vence'}</div>
              <div className={cx(styles.date, expired && styles.expired)}>
                {formatDate(student.expired_at)} ·{' '}
                {formatDaysUntil(daysUntil(student.expired_at))}
              </div>
            </>
          ) : (
            <div className={styles.label}>Todavía no registró pagos</div>
          )}
        </div>
        <Button
          sm
          variant="sec"
          onClick={() => navigate(`/c/pago?alumno=${student.id}`)}
        >
          {expired ? 'Renovar' : 'Registrar pago'}
        </Button>
      </div>
    </Card>
  );
}
