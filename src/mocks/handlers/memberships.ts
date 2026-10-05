import { HttpResponse } from 'msw/http';

import type { StudentsByMembershipStatus } from '@/api/pending';
import type { MembershipStatus } from '@/shared/lib/membershipStatus';

import { staffAccess } from '../access';
import { mockEndpoint, mockPendingEndpoint } from '../endpoint';
import { memberships } from '../fixtures/memberships';
import { studentMembershipStatus, students } from '../fixtures/students';
import { guardError } from '../responses';

const DAY = 24 * 60 * 60 * 1000;

const STATUSES: readonly MembershipStatus[] = [
  'active',
  'expiring_soon',
  'expired',
  'no_payments',
];

function isMembershipStatus(value: string | null): value is MembershipStatus {
  return STATUSES.some((status) => status === value);
}

/** Cuántos alumnos de demo hay en cada estado de membresía. */
function countsByStatus() {
  const counts = { active: 0, expiring_soon: 0, expired: 0, no_payments: 0 };
  for (const { id } of students) {
    counts[studentMembershipStatus(id) ?? 'active']++;
  }
  return counts;
}

/** Cuándo vence el último pago de un alumno según su estado, relativo a hoy; `null` si nunca pagó. */
function expiryFor(status: MembershipStatus): string | null {
  const days = {
    active: 18,
    expiring_soon: 3,
    expired: -30,
    no_payments: null,
  }[status];
  return days === null ? null : new Date(Date.now() + days * DAY).toISOString();
}

/** Los mocks de Membresías (tipos). Cuáles están encendidos lo dice `registry.ts`. */
export const membershipMocks = [
  mockEndpoint('get', '/api/v1/membership/all', () =>
    HttpResponse.json(memberships),
  ),

  // El resumen de estados es REAL: el mock atiende solo a las cuentas de demo, por su token falso.
  // Es de entrenadores y admins: con la cuenta de un alumno responde 403, como el guard.
  mockEndpoint('get', '/api/v1/membership/status/summary', ({ request }) => {
    const denied = staffAccess(request);
    if (denied) return denied;

    return HttpResponse.json({
      counts: countsByStatus(),
      total_students: students.length,
      expiring_soon_days: 7,
    });
  }),

  // Los alumnos con un estado de membresía es REAL y no tiene schema en el contrato (V1): la forma
  // sale del código del backend. El mock atiende solo a las cuentas de demo. Como el backend, los
  // ordena por apellido y nombre.
  mockPendingEndpoint<undefined, StudentsByMembershipStatus>(
    'get',
    '/api/v1/membership/status/users',
    ({ request }) => {
      const denied = staffAccess(request);
      if (denied) return denied;

      const status = new URL(request.url).searchParams.get('status');
      if (!isMembershipStatus(status)) {
        return guardError(400, [
          'status must be one of the following values: active, expiring_soon, expired, no_payments',
        ]);
      }

      const matching = students
        .filter(({ id }) => studentMembershipStatus(id) === status)
        .sort(
          (a, b) =>
            a.last_name.localeCompare(b.last_name) ||
            a.first_name.localeCompare(b.first_name),
        )
        .map((student) => ({
          id: student.id,
          first_name: student.first_name,
          last_name: student.last_name,
          email: student.email,
          membership_status: status,
          expired_at: expiryFor(status),
          membership_name:
            status === 'no_payments' ? null : memberships[0].name,
          membership_id: status === 'no_payments' ? null : memberships[0].id,
        }));
      return HttpResponse.json({
        status,
        total: matching.length,
        expiring_soon_days: 7,
        students: matching,
      });
    },
  ),
];
