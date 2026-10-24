import { HttpResponse } from 'msw/http';

import type { AssignedRoutineDetail, PlanSessionDetail } from '@/api/pending';
import type { MarkExerciseFinishedBody } from '@/api/types';
import { isCalendarDay } from '@/shared/lib/dates';

import { userAccess } from '../access';
import { mockEndpoint, mockPendingEndpoint } from '../endpoint';
import { franco } from '../fixtures/demoIndividuals';
import {
  findDemoIndividual,
  individualHasExercise,
  isIndividualMarked,
  markIndividual,
  unmarkIndividual,
} from '../fixtures/finishedMarks';
import {
  demoIndividualDetail,
  demoPlanSessionDetail,
} from '../fixtures/routineDetails';
import { guardError, serviceError } from '../responses';

const OTHER_STUDENT = 'No podés acceder a una rutina asignada a otro alumno.';

/** El largo máximo de `user_note` en `MarkExerciseFinishedDto`. */
const USER_NOTE_MAX_LENGTH = 100;

/** Los errores de validación de `MarkExerciseFinishedDto`, con el formato de la validación de Nest. */
function validateMark(body: Partial<MarkExerciseFinishedBody>): string[] {
  const errors: string[] = [];
  if (
    typeof body.routine_exercise_id !== 'string' ||
    !body.routine_exercise_id
  ) {
    errors.push('routine_exercise_id should not be empty');
  }
  if (
    body.finished_at !== undefined &&
    (typeof body.finished_at !== 'string' || !isCalendarDay(body.finished_at))
  ) {
    errors.push('finished_at must be a valid ISO 8601 date string');
  }
  if (body.user_note !== undefined) {
    if (typeof body.user_note !== 'string') {
      errors.push('user_note must be a string');
    } else if (body.user_note.length > USER_NOTE_MAX_LENGTH) {
      errors.push(
        `user_note must be shorter than or equal to ${USER_NOTE_MAX_LENGTH} characters`,
      );
    }
  }
  return errors;
}

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

  // Marcar un ejercicio de una rutina individual como hecho (CU-U-12 y CU-U-13): REAL, y el mock atiende solo a
  // las cuentas de demo. Cambia lo que el detalle y el home ven (`finishedMarks.ts`). Imita al backend, en su
  // orden: 400 por los datos (la validación corre antes que el service), 404 si la asignación no existe, 403
  // si es de otro alumno, y 400 si el ejercicio no es de la rutina o falta el día al marcar uno nuevo. 201 si
  // crea la marca y 200 si ya estaba (idempotente: corrige el día y la nota si cambiaron).
  mockEndpoint(
    'post',
    '/api/v1/routine/assign-user/{id}/finished',
    async ({ request, params }) => {
      const access = userAccess(request);
      if ('denied' in access) return access.denied;

      const body: Partial<MarkExerciseFinishedBody> = await request
        .json()
        .catch(() => ({}));
      const errors = validateMark(body);
      if (errors.length > 0) return guardError(400, errors);

      const demo = findDemoIndividual(params.id);
      if (!demo) return serviceError(404, 'Asignación no encontrada');
      if (demo.userId !== access.account.user.id) {
        return serviceError(403, OTHER_STUDENT);
      }

      const routineExerciseId = body.routine_exercise_id ?? '';
      if (!individualHasExercise(demo, routineExerciseId)) {
        return serviceError(
          400,
          'El ejercicio no pertenece a la rutina de la asignación.',
        );
      }
      if (
        body.finished_at === undefined &&
        !isIndividualMarked(demo, routineExerciseId)
      ) {
        return serviceError(
          400,
          'Indicá el día en que hiciste el ejercicio (finished_at).',
        );
      }

      const { entry, created } = markIndividual(demo, routineExerciseId, {
        finishedAt: body.finished_at,
        userNote: body.user_note,
      });
      return HttpResponse.json(entry, { status: created ? 201 : 200 });
    },
  ),

  // Desmarcar un ejercicio: borra la marca y su nota. Idempotente (también responde 200 si no estaba marcado).
  mockEndpoint(
    'delete',
    '/api/v1/routine/assign-user/{id}/finished/{routineExerciseId}',
    ({ request, params }) => {
      const access = userAccess(request);
      if ('denied' in access) return access.denied;

      const demo = findDemoIndividual(params.id);
      if (!demo) return serviceError(404, 'Asignación no encontrada');
      if (demo.userId !== access.account.user.id) {
        return serviceError(403, OTHER_STUDENT);
      }

      unmarkIndividual(demo, params.routineExerciseId);
      return HttpResponse.json({
        routine_exercise_id: params.routineExerciseId,
        finished: false,
      });
    },
  ),
];
