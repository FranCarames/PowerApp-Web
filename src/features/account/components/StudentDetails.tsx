import type { User, UserPlanificationAssignment } from '@/api/types';
import { formatDate, toCalendarDay } from '@/shared/lib/dates';
import {
  latestPayment,
  MEMBERSHIP_STATUS_LABEL,
  membershipStatusOf,
} from '@/shared/lib/membershipStatus';
import { DetailList, Skeleton } from '@/shared/ui';

import { useUserPayments } from '../hooks/useUserPayments';
import { useUserPlanifications } from '../hooks/useUserPlanifications';

/**
 * La planificación vigente hoy: la primera asignación activa cuyo rango incluye el día de hoy. Las
 * fechas son días de calendario (`YYYY-MM-DD`), así que se comparan como texto.
 */
function currentAssignment(assignments: UserPlanificationAssignment[]) {
  const today = toCalendarDay();
  return assignments.find(
    ({ start_date, end_date }) => start_date <= today && today <= end_date,
  );
}

/** "Fuerza 5×5 · vigente hasta 12 Dic 2026". */
function planificationText({
  planification,
  end_date,
}: UserPlanificationAssignment) {
  const until = `vigente hasta ${formatDate(end_date)}`;
  return planification.name ? `${planification.name} · ${until}` : until;
}

/**
 * Los datos de un alumno en su detalle, el del Admin y el del Entrenador: el email, la membresía (la
 * del último pago, la misma query que el historial) y la planificación vigente. Esta última se
 * muestra solo si el alumno tiene una asignación vigente hoy y la consulta respondió.
 */
export function StudentDetails({
  user,
  className,
}: {
  user: User;
  className?: string;
}) {
  const payments = useUserPayments(user.id);
  const planifications = useUserPlanifications(user.id);
  const current = planifications.data
    ? currentAssignment(planifications.data)
    : undefined;

  let membership;
  if (payments.isPending) {
    membership = <Skeleton width={96} height={14} radius={6} />;
  } else if (payments.data) {
    const latest = latestPayment(payments.data);
    const status = membershipStatusOf(latest);
    membership =
      latest && status !== 'no_payments'
        ? `${latest.name} · ${MEMBERSHIP_STATUS_LABEL[status]}`
        : 'Sin membresía';
  } else {
    membership = 'No se pudo cargar';
  }

  return (
    <DetailList
      className={className}
      items={[
        { label: 'Email', value: user.email },
        { label: 'Membresía', value: membership },
        ...(current
          ? [{ label: 'Planificación', value: planificationText(current) }]
          : []),
      ]}
    />
  );
}
