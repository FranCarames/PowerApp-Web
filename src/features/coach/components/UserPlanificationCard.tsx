import type { ReactNode } from 'react';

import type { UserPlanificationAssignment } from '@/api/types';
import { cx } from '@/shared/lib/cx';
import { formatDate } from '@/shared/lib/dates';
import { Card, Pill } from '@/shared/ui';

import {
  ASSIGNMENT_STATUS_LABEL,
  ASSIGNMENT_STATUS_TONE,
  assignmentStatus,
} from '../userPlanification';
import styles from './UserPlanificationCard.module.css';

/**
 * Una planificación asignada a un alumno: el nombre del plan, en qué está (vigente, próxima, terminada
 * o quitada, que se deduce de las fechas), sus fechas y la nota del entrenador. Una quitada se ve
 * apagada. `action` es lo que se puede hacer con ella (Quitar o Reincorporar), al pie.
 */
export function UserPlanificationCard({
  assignment,
  action,
}: {
  assignment: UserPlanificationAssignment;
  action?: ReactNode;
}) {
  const { planification, start_date, end_date, coach_note } = assignment;
  const status = assignmentStatus(assignment);

  return (
    <Card className={cx(styles.card, status === 'removed' && styles.removed)}>
      <div className={styles.head}>
        <span
          className={cx(styles.name, !planification.name && styles.unnamed)}
        >
          {planification.name || 'Sin nombre'}
        </span>
        <Pill tone={ASSIGNMENT_STATUS_TONE[status]}>
          {ASSIGNMENT_STATUS_LABEL[status]}
        </Pill>
      </div>
      <div className={styles.dates}>
        {formatDate(start_date)} → {formatDate(end_date)}
      </div>
      {/* El backend manda `null` en la nota que no tiene. */}
      {coach_note && <div className={styles.note}>{coach_note}</div>}
      {action && <div className={styles.foot}>{action}</div>}
    </Card>
  );
}
