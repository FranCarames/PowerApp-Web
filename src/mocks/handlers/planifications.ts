import { HttpResponse } from 'msw/http';

import { staffAccess, withoutInactive } from '../access';
import { mockEndpoint } from '../endpoint';
import { planifications } from '../fixtures/planifications';
import { studentMembershipStatus, students } from '../fixtures/students';
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

  // La planificación vigente de un alumno es REAL en el contrato, pero el backend todavía no la
  // responde (el controller no llama al service y el request queda colgado). El mock imita lo que
  // pasará cuando lo haga, y solo atiende a las cuentas de demo. Sin planificación, 404 (la forma de
  // decirlo es la del PLAN, B7: a confirmar).
  mockEndpoint(
    'get',
    '/api/v1/planification/user/{id}/active',
    ({ request, params }) => {
      const denied = staffAccess(request);
      if (denied) return denied;

      const index = students.findIndex(({ id }) => id === params.id);
      if (index < 0 || index >= WITH_PLANIFICATION) {
        return serviceError(
          404,
          'El usuario no tiene una planificación vigente',
        );
      }

      const plan = planifications[index % 4];
      const start = new Date(Date.now() - 14 * DAY);
      const end = new Date(Date.now() + 42 * DAY);
      return HttpResponse.json({
        id: `demo-user-planification-${index + 1}`,
        user_id: params.id,
        planification_id: plan.id,
        description: plan.description,
        number_of_routines: plan.number_of_routines,
        type: plan.type,
        duration: plan.duration,
        start_date: start.toISOString(),
        end_date: end.toISOString(),
        active: studentMembershipStatus(params.id) !== 'expired',
        created_at: start.toISOString(),
        updated_at: start.toISOString(),
      });
    },
  ),
];
