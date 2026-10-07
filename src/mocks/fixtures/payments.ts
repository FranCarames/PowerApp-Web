import type { Membership, MembershipPayment } from '@/api/types';

import { memberships } from './memberships';
import { studentMembershipStatus, students } from './students';
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
  type: Membership = monthly,
): MembershipPayment {
  const created = new Date(Date.now() - paidDaysAgo * DAY);
  // El pago guarda su propia copia del nombre, la duración y el precio del tipo, como el backend.
  return {
    id: `demo-payment-${userId}-${index}`,
    user_id: userId,
    membership_id: type.id,
    name: type.name,
    duration: type.duration,
    active: true,
    price,
    created_at: created.toISOString(),
    updated_at: created.toISOString(),
    expired_at: new Date(created.getTime() + type.duration * DAY).toISOString(),
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

/**
 * Los pagos de un alumno de demo según su estado de membresía (`students.ts`). Franco y Lucía, que
 * pueden entrar, tienen los suyos: ver arriba. A cada alumno le quedan (o hace cuántos días se le
 * vencieron) distintos días, para que el control de membresías no muestre a todos con la misma fecha:
 * el último pago se fecha según la duración de su tipo, así que el estado que dan sus fechas es el
 * mismo de `students.ts`.
 */
function paymentsForStatus(userId: string): MembershipPayment[] {
  const status = studentMembershipStatus(userId);
  if (status === undefined || status === 'no_payments') return [];

  const type = membershipTypeOfStudent(userId) ?? monthly;
  const position = students.findIndex(({ id }) => id === userId);
  // Días que le quedan al último pago; negativo si ya venció. "Por vencer" empieza en 1: un pago que
  // vence hoy a esta misma hora ya estaría vencido cuando se lo mire.
  const left = {
    active: 8 + ((position * 7) % 50),
    expiring_soon: 1 + (position % 7),
    expired: -(1 + ((position * 5) % 60)),
  }[status];
  const paidDaysAgo = type.duration - left;
  // Un pago anterior, de antes de la última suba de precios.
  const before = type.price - 1500;
  return status === 'expiring_soon'
    ? [payment(userId, 0, paidDaysAgo, type.price, type)]
    : [
        payment(userId, 0, paidDaysAgo, type.price, type),
        payment(userId, 1, paidDaysAgo + type.duration, before, type),
      ];
}

// El tipo del último pago de los alumnos de demo, por su posición en `students`: casi todos pagan el
// mensual, y los demás el trimestral, el anual y el semestral (que está dado de baja: sus pagos
// anteriores siguen ahí). Franco y Lucía, que tienen sus pagos aparte, pagan el mensual.
const TYPE_AT_POSITION = [0, 0, 1, 3, 0, 2] as const;

/** El tipo del último pago de un alumno de demo, o `undefined` si nunca pagó (o no es de demo). */
export function membershipTypeOfStudent(
  userId: string,
): Membership | undefined {
  if (userId in PAYMENTS_BY_USER) return monthly;
  const status = studentMembershipStatus(userId);
  if (status === undefined || status === 'no_payments') return undefined;
  const position = students.findIndex(({ id }) => id === userId);
  return memberships[TYPE_AT_POSITION[position % TYPE_AT_POSITION.length]];
}

/** Los pagos de un alumno de demo, sin ordenar (como los devuelve el backend). */
export function demoPaymentsFor(userId: string): MembershipPayment[] {
  return PAYMENTS_BY_USER[userId] ?? paymentsForStatus(userId);
}
