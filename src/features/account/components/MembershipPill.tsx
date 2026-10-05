import {
  latestPayment,
  MEMBERSHIP_STATUS_TONE,
  membershipStatusOf,
  type MembershipStatus,
} from '@/shared/lib/membershipStatus';
import { Pill, Skeleton } from '@/shared/ui';

import { useUserPayments } from '../hooks/useUserPayments';

const LABEL: Record<MembershipStatus, string> = {
  active: 'Membresía activa',
  expiring_soon: 'Membresía por vencer',
  expired: 'Membresía vencida',
  no_payments: 'Sin membresía',
};

/**
 * El estado de la membresía bajo el nombre, en Mi cuenta del alumno. Sale del último pago, que
 * comparte la query con el historial de pagos. Mientras carga, reserva su lugar, y si no se pudo
 * cargar no se muestra: es un dato de apoyo y el historial tiene su propio estado de error.
 */
export function MembershipPill({ userId }: { userId: string }) {
  const { data, isPending } = useUserPayments(userId);

  if (isPending) return <Skeleton width={128} height={20} radius={999} />;
  if (!data) return null;

  const status = membershipStatusOf(latestPayment(data));
  return <Pill tone={MEMBERSHIP_STATUS_TONE[status]}>{LABEL[status]}</Pill>;
}
