import { HttpResponse } from 'msw/http';

import type {
  StudentMembership,
  StudentsByMembershipStatus,
  StudentsByMembershipType,
  StudentsByMembershipTypeGroup,
} from '@/api/pending';
import type { Membership } from '@/api/types';
import {
  latestPayment,
  type MembershipStatus,
} from '@/shared/lib/membershipStatus';

import { adminAccess, staffAccess } from '../access';
import { mockEndpoint, mockPendingEndpoint } from '../endpoint';
import { memberships } from '../fixtures/memberships';
import { demoPaymentsFor, membershipTypeOfStudent } from '../fixtures/payments';
import { studentMembershipStatus, students } from '../fixtures/students';
import { guardError, serviceError } from '../responses';

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

/** Cuándo vence el último pago de un alumno de demo (el de vencimiento más lejano); `null` si nunca pagó. */
function expiryOf(studentId: string): string | null {
  return latestPayment(demoPaymentsFor(studentId))?.expired_at ?? null;
}

// Los tipos de membresía de demo viven en memoria: lo que el Admin crea, edita o da de baja se ve en
// la pantalla hasta que se recarga la página. Los pagos ya registrados no cambian: cada uno guarda su
// copia del nombre, la duración y el precio (`fixtures/payments.ts`).
const types: Membership[] = memberships.map((type) => ({ ...type }));

/** Los errores de validación del DTO (`CreateMembershipDto` y `EditMembershipDto`, que son iguales). */
function validate(body: {
  name?: string;
  duration?: number;
  price?: number;
}): string[] {
  const errors: string[] = [];
  if (!body.name) errors.push('name should not be empty');
  else if (body.name.length > 50) {
    errors.push('name must be shorter than or equal to 50 characters');
  }
  if (!Number.isInteger(body.duration)) {
    errors.push('duration must be an integer number');
  } else if ((body.duration ?? 0) < 1) {
    errors.push('duration must not be less than 1');
  }
  if (typeof body.price !== 'number') {
    errors.push(
      'price must be a number conforming to the specified constraints',
    );
  } else if (body.price < 0.01) {
    errors.push('price must not be less than 0.01');
  }
  return errors;
}

/** Un alumno de demo con su estado y el tipo de su último pago, como lo manda el backend. */
function studentMembership(student: (typeof students)[number]) {
  const status = studentMembershipStatus(student.id) ?? 'active';
  const type = membershipTypeOfStudent(student.id);
  return {
    id: student.id,
    first_name: student.first_name,
    last_name: student.last_name,
    email: student.email,
    membership_status: status,
    expired_at: expiryOf(student.id),
    membership_name: type?.name ?? null,
    membership_id: type?.id ?? null,
  } satisfies StudentMembership;
}

/** Los mocks de Membresías (tipos). Cuáles están encendidos lo dice `registry.ts`. */
export const membershipMocks = [
  // El listado es REAL y público: trae todos los tipos, también los dados de baja.
  mockEndpoint('get', '/api/v1/membership/all', () => HttpResponse.json(types)),

  // Alta, edición y baja lógica son solo del Admin y se mockean para las cuentas de demo. Como el
  // backend, el alta rechaza una duración que ya tiene otro tipo (400) y la edición y el set-active
  // responden sin ese chequeo.
  mockEndpoint('post', '/api/v1/membership/create', async ({ request }) => {
    const denied = adminAccess(request);
    if (denied) return denied;

    const body = await request.json();
    const errors = validate(body);
    if (errors.length > 0) return guardError(400, errors);
    if (types.some(({ duration }) => duration === body.duration)) {
      return serviceError(400, 'Ya existe una membresía con esa duración');
    }

    const now = new Date().toISOString();
    const created: Membership = {
      id: crypto.randomUUID(),
      name: body.name,
      duration: body.duration,
      price: body.price,
      active: true,
      created_at: now,
      updated_at: now,
    };
    types.push(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  mockEndpoint(
    'post',
    '/api/v1/membership/edit/{id}',
    async ({ request, params }) => {
      const denied = adminAccess(request);
      if (denied) return denied;

      const type = types.find(({ id }) => id === params.id);
      if (!type) return serviceError(404, 'Membresía no encontrada');
      const body = await request.json();
      const errors = validate(body);
      if (errors.length > 0) return guardError(400, errors);

      type.name = body.name;
      type.duration = body.duration;
      type.price = body.price;
      type.updated_at = new Date().toISOString();
      return HttpResponse.json(type, { status: 201 });
    },
  ),

  mockEndpoint(
    'post',
    '/api/v1/membership/set-active/{id}',
    async ({ request, params }) => {
      const denied = adminAccess(request);
      if (denied) return denied;

      const type = types.find(({ id }) => id === params.id);
      if (!type) return serviceError(404, 'Membresía no encontrada');
      const body = await request.json();
      if (typeof body.active !== 'boolean') {
        return guardError(400, ['active must be a boolean value']);
      }

      type.active = body.active;
      type.updated_at = new Date().toISOString();
      return HttpResponse.json(type);
    },
  ),

  // Los alumnos por tipo de membresía es REAL y no tiene schema en el contrato (V1): la forma sale del
  // código del backend. Agrupa por el tipo del último pago; los que nunca pagaron no entran en ningún
  // grupo. Solo de entrenadores y admins.
  mockPendingEndpoint<undefined, StudentsByMembershipType>(
    'get',
    '/api/v1/membership/type/users',
    ({ request }) => {
      const denied = staffAccess(request);
      if (denied) return denied;

      const withPayments = students
        .map(studentMembership)
        .filter(({ membership_id }) => membership_id !== null);
      const groups = new Map<string, StudentsByMembershipTypeGroup>();
      for (const student of withPayments) {
        const id = student.membership_id;
        const name = student.membership_name;
        if (id === null || name === null) continue;
        const group = groups.get(id) ?? {
          membership_id: id,
          membership_name: name,
          total: 0,
          students: [],
        };
        group.students.push(student);
        group.total++;
        groups.set(id, group);
      }
      return HttpResponse.json({
        total_students: withPayments.length,
        without_payments: students.length - withPayments.length,
        groups: [...groups.values()],
      });
    },
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
        .map(studentMembership);
      return HttpResponse.json({
        status,
        total: matching.length,
        expiring_soon_days: 7,
        students: matching,
      });
    },
  ),
];
