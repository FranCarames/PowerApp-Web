import { HttpResponse } from 'msw/http';

import type { AssignedRoutineDetail, PlanSessionDetail } from '@/api/pending';

import { userAccess } from '../access';
import { mockPendingEndpoint } from '../endpoint';
import { franco } from '../fixtures/home';
import {
  demoIndividualDetail,
  demoPlanSessionDetail,
} from '../fixtures/routineDetails';
import { serviceError } from '../responses';

const OTHER_STUDENT = 'No podés acceder a una rutina asignada a otro alumno.';

/** Los mocks del detalle de una rutina del alumno. Cuáles están encendidos lo dice `registry.ts`. */
export const routineDetailMocks = [
  // El detalle de una rutina individual es REAL: el mock atiende solo a las cuentas de demo, por su
  // token falso. Va con `mockPendingEndpoint` porque el contrato declara el `exercise` de cada ejercicio
  // como un objeto vacío (V2): los tipos son los de `pending.ts`. Imita al backend, en su orden: 404 si la asignación no existe y 403 si es de otro alumno.
  mockPendingEndpoint<undefined, AssignedRoutineDetail>(
    'get',
    '/api/v1/routine/assign-user/{id}',
    ({ request, params }) => {
      const access = userAccess(request);
      if ('denied' in access) return access.denied;

      const found = demoIndividualDetail(params.id);
      if (!found) return serviceError(404, 'Asignación no encontrada');
      if (found.userId !== access.account.user.id) {
        return serviceError(403, OTHER_STUDENT);
      }
      return HttpResponse.json(found.detail);
    },
  ),

  // Una rutina de una semana del plan, también REAL. Las validaciones y sus textos son las de la spec
  // del backend: 404 si la asignación no existe, 403 si es de otro alumno, 404 si la rutina no es del
  // plan y 404 si el entrenador la quitó del plan y el alumno no hizo nada en ella. El plan de demo es
  // el de Franco: para cualquier otra cuenta, la asignación existe pero no es suya.
  mockPendingEndpoint<undefined, PlanSessionDetail>(
    'get',
    '/api/v1/routine/assign-plan/{userPlanificationId}/{routineAsignationId}',
    ({ request, params }) => {
      const access = userAccess(request);
      if ('denied' in access) return access.denied;

      const result = demoPlanSessionDetail(
        params.userPlanificationId,
        params.routineAsignationId,
      );
      if (result === 'no-assignment') {
        return serviceError(404, 'Asignación no encontrada');
      }
      if (access.account.user.id !== franco.id) {
        return serviceError(403, OTHER_STUDENT);
      }
      if (result === 'not-in-plan') {
        return serviceError(
          404,
          'La rutina no pertenece a esta planificación.',
        );
      }
      if (result === 'removed') {
        return serviceError(404, 'La rutina fue quitada de la planificación.');
      }
      return HttpResponse.json(result);
    },
  ),
];
