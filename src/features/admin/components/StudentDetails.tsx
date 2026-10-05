import type { User } from '@/api/types';
import { useActiveUserPlanification } from '@/features/account/hooks/useActiveUserPlanification';
import { useUserPayments } from '@/features/account/hooks/useUserPayments';
import { formatDate } from '@/shared/lib/dates';
import {
  latestPayment,
  MEMBERSHIP_STATUS_LABEL,
  membershipStatusOf,
} from '@/shared/lib/membershipStatus';
import { DetailList, Skeleton } from '@/shared/ui';

/** "Fuerza · vigente hasta 12 Dic 2026". */
function planificationText(type: string | undefined, endDate: string) {
  const until = `vigente hasta ${formatDate(endDate)}`;
  return type
    ? `${type.charAt(0).toUpperCase()}${type.slice(1)} · ${until}`
    : until;
}

/**
 * Los datos de un alumno en su detalle: el email, la membresía (la del último pago, la misma query
 * que el historial) y la planificación vigente. Esta última se muestra solo si el backend la
 * respondió: hasta el bloque C2 no lo hace, y entonces se omite.
 */
export function StudentDetails({ user }: { user: User }) {
  const payments = useUserPayments(user.id);
  const planification = useActiveUserPlanification(user.id);

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
      items={[
        { label: 'Email', value: user.email },
        { label: 'Membresía', value: membership },
        ...(planification.data
          ? [
              {
                label: 'Planificación',
                value: planificationText(
                  planification.data.type,
                  planification.data.end_date,
                ),
              },
            ]
          : []),
      ]}
    />
  );
}
