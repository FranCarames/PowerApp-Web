import { HttpResponse } from 'msw/http';

import { toCalendarDay } from '@/shared/lib/dates';

import { staffAccess, withoutInactive } from '../access';
import { mockEndpoint } from '../endpoint';
import { planifications } from '../fixtures/planifications';
import { students } from '../fixtures/students';
import { demoAccounts } from '../fixtures/users';
import { serviceError } from '../responses';

const DAY = 24 * 60 * 60 * 1000;

// Los primeros 12 alumnos de demo tienen una planificación vigente; los demás, ninguna.
const WITH_PLANIFICATION = 12;

/** Los mocks de planificaciones. Cuáles están encendidos lo dice `registry.ts`. */
export const planificationMocks = [
  // El listado es REAL: el mock atiende solo a las cuentas de demo, por su token falso.
  mockEndpoint('get', '/api/v1/planification/all', ({ request }) => {
    const denied = staffAccess(request);
    if (denied) return denied;
    return HttpResponse.json(withoutInactive(planifications, request));
  }),

  // Las planificaciones asignadas a un alumno (B7) son REAL: el mock atiende solo a las cuentas de
  // demo. Imita al backend: 404 si el usuario no existe, `[]` si no tiene ninguna, y las asignaciones
  // activas con la forma de `UserPlanificationResponseDto` (las fechas son días de calendario).
  mockEndpoint(
    'get',
    '/api/v1/planification/user/{userId}',
    ({ request, params }) => {
      const denied = staffAccess(request);
      if (denied) return denied;

      const index = students.findIndex(({ id }) => id === params.userId);
      if (index < 0) return serviceError(404, 'Usuario no encontrado');
      if (index >= WITH_PLANIFICATION) return HttpResponse.json([]);

      const plan = planifications[index % 4];
      const start = new Date(Date.now() - 14 * DAY);
      const end = new Date(Date.now() + 42 * DAY);
      const coach = demoAccounts.find(({ user }) => user.role === 'coach');
      return HttpResponse.json([
        {
          id: `demo-user-planification-${index + 1}`,
          user_id: params.userId,
          coach_id: coach?.user.id ?? 'demo-coach',
          planification_id: plan.id,
          start_date: toCalendarDay(start),
          end_date: toCalendarDay(end),
          coach_note: null,
          active: true,
          created_at: start.toISOString(),
          updated_at: start.toISOString(),
          planification: {
            id: plan.id,
            name: plan.name ?? null,
            duration: plan.duration,
            active: plan.active,
          },
        },
      ]);
    },
  ),
];
