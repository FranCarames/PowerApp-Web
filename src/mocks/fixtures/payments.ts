import type { MembershipPayment } from '@/api/types';

import { memberships } from './memberships';
import { demoAccounts } from './users';

// Los pagos de las cuentas de demo. Las fechas son relativas a hoy, y no fijas, para que el estado de
// la membresía (activa, por vencer) sea el mismo sin importar el día en que se mire.
//
// El de Franco tiene 4 pagos mensuales y vence en 15 días: activa. El de Lucía tiene 1 que vence en
// 3 días: por vencer. Las demás cuentas no tienen pagos.

const DAY = 24 * 60 * 60 * 1000;
const [monthly] = memberships;

function payment(
  userId: string,
  index: number,
  paidDaysAgo: number,
  price: number,
): MembershipPayment {
  const created = new Date(Date.now() - paidDaysAgo * DAY);
  return {
    id: `demo-payment-${userId}-${index}`,
    user_id: userId,
    membership_id: monthly.id,
    name: monthly.name,
    duration: monthly.duration,
    active: true,
    price,
    created_at: created.toISOString(),
    updated_at: created.toISOString(),
    expired_at: new Date(
      created.getTime() + monthly.duration * DAY,
    ).toISOString(),
  };
}

// Las cuentas de alumno que pueden entrar, en el orden de la fixture: Franco y Lucía.
const [franco, lucia] = demoAccounts.filter(
  (account) => account.user.role === 'user' && !account.closed,
);

const PAYMENTS_BY_USER: Record<string, MembershipPayment[]> = {
  [franco.user.id]: [
    payment(franco.user.id, 0, 15, monthly.price),
    payment(franco.user.id, 1, 45, monthly.price),
    payment(franco.user.id, 2, 75, 18000),
    payment(franco.user.id, 3, 105, 18000),
  ],
  [lucia.user.id]: [payment(lucia.user.id, 0, 27, monthly.price)],
};

/** Los pagos de una cuenta de demo, sin ordenar (como los devuelve el backend). */
export function demoPaymentsFor(userId: string): MembershipPayment[] {
  return PAYMENTS_BY_USER[userId] ?? [];
}
