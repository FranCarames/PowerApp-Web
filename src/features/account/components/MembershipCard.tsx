import type { MembershipPayment } from '@/api/types';
import { cx } from '@/shared/lib/cx';
import { formatDate } from '@/shared/lib/dates';
import {
  MEMBERSHIP_STATUS_LABEL,
  MEMBERSHIP_STATUS_TONE,
  type MembershipStatus,
} from '@/shared/lib/membershipStatus';
import { Card, Pill } from '@/shared/ui';

import styles from './MembershipCard.module.css';

interface MembershipCardProps {
  /** El último pago: el de vencimiento más lejano. */
  payment: MembershipPayment;
  status: Exclude<MembershipStatus, 'no_payments'>;
}

/**
 * La membresía actual del alumno, según su último pago: el plan, su estado y cuándo vence. El color
 * sale del estado (verde, amarillo, rojo); si ya venció, es la última que tuvo.
 */
export function MembershipCard({ payment, status }: MembershipCardProps) {
  const tone = MEMBERSHIP_STATUS_TONE[status];
  const expired = status === 'expired';

  return (
    <Card row tone={tone} className={styles.card}>
      <div>
        <div className={styles.label}>
          {expired ? 'Última membresía' : 'Membresía actual'}
        </div>
        <div className={styles.nameRow}>
          <span className={cx(styles.name, styles[tone])}>{payment.name}</span>
          <Pill tone={tone}>{MEMBERSHIP_STATUS_LABEL[status]}</Pill>
        </div>
      </div>
      <div className={styles.expiry}>
        <div className={styles.expiryLabel}>{expired ? 'Venció' : 'Vence'}</div>
        <div className={styles.date}>{formatDate(payment.expired_at)}</div>
      </div>
    </Card>
  );
}
