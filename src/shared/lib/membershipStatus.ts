import type { MembershipPayment } from '@/api/types';

/** Los cuatro estados de una membresía. Los mismos que usa el backend (`MembershipStatus`). */
export type MembershipStatus =
  'active' | 'expiring_soon' | 'expired' | 'no_payments';

/**
 * Cuántos días antes del vencimiento una membresía pasa a "por vencer". El backend lo configura
 * (`MEMBERSHIP_EXPIRING_SOON_DAYS`, 7 por defecto) y lo informa como `expiring_soon_days` en el
 * resumen, pero ese endpoint es solo de entrenadores y admins: el alumno usa el valor por defecto.
 */
export const EXPIRING_SOON_DAYS = 7;

/** Cómo se nombra cada estado y de qué color se pinta (`mut` es el gris neutro). */
export const MEMBERSHIP_STATUS_LABEL: Record<MembershipStatus, string> = {
  active: 'Activa',
  expiring_soon: 'Por vencer',
  expired: 'Vencida',
  no_payments: 'Sin pagos',
};

export const MEMBERSHIP_STATUS_TONE = {
  active: 'ok',
  expiring_soon: 'warn',
  expired: 'err',
  no_payments: 'mut',
} as const satisfies Record<MembershipStatus, string>;

/** De todos los pagos, el de vencimiento más lejano es el que manda (igual que en el backend). */
export function latestPayment(
  payments: readonly MembershipPayment[],
): MembershipPayment | null {
  return payments.reduce<MembershipPayment | null>(
    (latest, payment) =>
      !latest ||
      new Date(payment.expired_at).getTime() >
        new Date(latest.expired_at).getTime()
        ? payment
        : latest,
    null,
  );
}

/**
 * El estado de la membresía según el vencimiento de su último pago, no el flag `active` del pago
 * (que el backend solo actualiza una vez por día). Como el backend, la ventana de "por vencer" se
 * corta al final del día.
 */
export function membershipStatusOf(
  payment: MembershipPayment | null,
  now: Date = new Date(),
): MembershipStatus {
  if (!payment) return 'no_payments';

  const expiredAt = new Date(payment.expired_at).getTime();
  if (expiredAt < now.getTime()) return 'expired';

  const threshold = new Date(now);
  threshold.setDate(threshold.getDate() + EXPIRING_SOON_DAYS);
  threshold.setHours(23, 59, 59, 999);
  return expiredAt <= threshold.getTime() ? 'expiring_soon' : 'active';
}
