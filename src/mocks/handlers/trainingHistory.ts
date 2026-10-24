import { HttpResponse } from 'msw/http';

import { staffAccess } from '../access';
import { mockEndpoint } from '../endpoint';
import { trainingHistoryFor } from '../fixtures/trainingHistory';
import { serviceError } from '../responses';
import { findMockUser } from './users';

/** Los mocks del historial de entrenamientos del alumno. Cuáles están encendidos lo dice `registry.ts`. */
export const trainingHistoryMocks = [
  // El historial de un alumno es REAL (B6): el mock atiende solo a las cuentas de demo, por su token falso;
  // con un token de verdad va al backend. Imita al backend: solo coach y admin (el alumno recibe el 403 del
  // guard) y 404 si el usuario no existe. Como él, un usuario que no es alumno, uno sin sesiones o un
  // `exercise_id` que no existe responden 200 con la lista vacía, y no valida los ids (los de demo no son UUID).
  mockEndpoint(
    'get',
    '/api/v1/routine/history/{userId}',
    ({ request, params }) => {
      const denied = staffAccess(request);
      if (denied) return denied;

      if (!findMockUser(params.userId)) {
        return serviceError(404, 'Usuario no encontrado');
      }
      const exerciseId =
        new URL(request.url).searchParams.get('exercise_id') ?? undefined;
      return HttpResponse.json(trainingHistoryFor(params.userId, exerciseId));
    },
  ),
];
