import { passthrough } from 'msw';
import { HttpResponse } from 'msw/http';

import type { UserRmWithExercise } from '@/api/pending';

import { userAccess } from '../access';
import { mockEndpoint, mockPendingEndpoint } from '../endpoint';
import {
  createDemoRm,
  deleteDemoRm,
  demoRmsFor,
  editDemoRm,
  findDemoExercise,
  findDemoRm,
  type RmBody,
} from '../fixtures/userRms';
import { demoAccountForToken } from '../fixtures/users';
import { emptyResponse, guardError, serviceError } from '../responses';

/** Los errores de validación de `CreateUserRmDto` y `EditUserRmDto`, que son iguales. */
function validate(body: Partial<RmBody>): string[] {
  const errors: string[] = [];
  const { weight, reps, date } = body;
  if (typeof weight !== 'number' || !Number.isFinite(weight)) {
    errors.push(
      'weight must be a number conforming to the specified constraints',
    );
  } else if (weight < 0.99) {
    errors.push('weight must not be less than 0.99');
  } else if (Math.abs(weight * 100 - Math.round(weight * 100)) > 1e-6) {
    errors.push(
      'weight must be a number conforming to the specified constraints',
    );
  }
  if (typeof reps !== 'number' || !Number.isInteger(reps)) {
    errors.push('reps must be an integer number');
  } else if (reps < 1) {
    errors.push('reps must not be less than 1');
  }
  if (typeof date !== 'string' || Number.isNaN(Date.parse(date))) {
    errors.push('date must be a valid ISO 8601 date string');
  }
  if (!body.exercise_id) errors.push('exercise_id should not be empty');
  return errors;
}

/** Los mocks de los RMs. Cuáles están encendidos lo dice `registry.ts`. */
export const userRmMocks = [
  // Leer los RMs de un usuario es REAL: el mock atiende solo a las cuentas de demo, por su token
  // falso, y responde por cualquier alumno de demo (el entrenador mira los de los demás). Con un
  // token de verdad va al backend. Como él, no valida el id (los de demo no son UUID) y un usuario
  // sin RMs es un 200 con la lista vacía. Es un mock "pendiente" porque el backend manda otra forma
  // que el contrato (V10): cada RM con su ejercicio anidado y sin `exercise_id`.
  mockPendingEndpoint<undefined, UserRmWithExercise[]>(
    'get',
    '/api/v1/user_rm/user/{id}',
    ({ request, params }) =>
      demoAccountForToken(request.headers.get('Authorization'))
        ? HttpResponse.json(demoRmsFor(params.id))
        : passthrough(),
  ),

  // Alta, edición y baja de un RM: son solo del Usuario (CU-U-17, CU-U-18 y CU-U-20). El mock atiende
  // a las cuentas de demo y lo que hacen se ve en la lista hasta recargar. Las reglas son las del
  // service: un usuario solo toca lo suyo (403), el ejercicio y el RM tienen que existir (404) y la
  // fecha tiene que ser válida (400).
  mockEndpoint('post', '/api/v1/user_rm/create', async ({ request }) => {
    const access = userAccess(request);
    if ('denied' in access) return access.denied;
    const { account } = access;

    const body = await request.json();
    const errors = validate(body);
    if (errors.length > 0) return guardError(400, errors);
    if (body.user_id !== account.user.id) {
      return serviceError(403, 'No podés crear RMs para otro usuario.');
    }

    const created = createDemoRm(account.user, body);
    if (!created) return serviceError(404, 'Ejercicio no encontrado');
    return HttpResponse.json(created, { status: 201 });
  }),

  // El backend responde 201 al editar, aunque el contrato dice 200.
  mockEndpoint(
    'post',
    '/api/v1/user_rm/edit/{id}',
    async ({ request, params }) => {
      const access = userAccess(request);
      if ('denied' in access) return access.denied;
      const { account } = access;

      const body = await request.json();
      const errors = validate(body);
      if (errors.length > 0) return guardError(400, errors);

      const existing = findDemoRm(params.id);
      if (!existing) return serviceError(404, 'RM de usuario no encontrado');
      if (
        existing.user.id !== account.user.id ||
        body.user_id !== account.user.id
      ) {
        return serviceError(403, 'No podés editar RMs de otro usuario.');
      }
      if (!findDemoExercise(body.exercise_id)) {
        return serviceError(404, 'Ejercicio no encontrado');
      }

      const edited = editDemoRm(existing, body);
      if (!edited) return serviceError(404, 'Ejercicio no encontrado');
      return HttpResponse.json(edited, { status: 201 });
    },
  ),

  mockEndpoint('delete', '/api/v1/user_rm/{id}', ({ request, params }) => {
    const access = userAccess(request);
    if ('denied' in access) return access.denied;

    const existing = findDemoRm(params.id);
    if (!existing) return serviceError(404, 'RM de usuario no encontrado');
    if (existing.user.id !== access.account.user.id) {
      return serviceError(403, 'No podés eliminar RMs de otro usuario.');
    }

    deleteDemoRm(existing);
    return emptyResponse();
  }),
];
