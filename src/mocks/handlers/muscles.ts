import { passthrough } from 'msw';
import { HttpResponse } from 'msw/http';

import type { MuscleWithGroup } from '@/api/pending';
import type { Muscle } from '@/api/types';

import { adminAccess } from '../access';
import { mockEndpoint, mockPendingEndpoint } from '../endpoint';
import {
  demoMuscleGroups,
  demoMuscles,
  groupsWithMuscles,
  muscleById,
  musclesWithGroup,
  type DemoMuscle,
} from '../fixtures/muscles';
import { demoAccountForSession } from '../fixtures/users';
import { emptyResponse, guardError, serviceError } from '../responses';

const TEXT_FIELDS = ['description', 'image_url', 'preview_image'] as const;

/** Los errores de validación del DTO (`CreateMuscleDto` y `EditMuscleDto`, que son iguales). */
function validate(body: {
  muscle_group_id?: string;
  name?: string;
  description?: string | null;
  image_url?: string | null;
  preview_image?: string | null;
}): string[] {
  const errors: string[] = [];
  if (!body.muscle_group_id) errors.push('muscle_group_id should not be empty');
  if (!body.name) errors.push('name should not be empty');
  else if (body.name.length > 50) {
    errors.push('name must be shorter than or equal to 50 characters');
  }
  // `IsOptional` deja pasar `undefined` y `null`, pero no el texto vacío.
  for (const field of TEXT_FIELDS) {
    if (body[field] === '') errors.push(`${field} should not be empty`);
  }
  return errors;
}

/** Un `Muscle` completo, como lo devuelven el alta y la edición. */
function toMuscle(muscle: DemoMuscle): Muscle {
  return {
    id: muscle.id,
    muscle_group_id: muscle.groupId,
    name: muscle.name,
    description: muscle.description,
    image_url: muscle.image_url,
    preview_image: muscle.preview_image,
    created_at: '2026-03-01T15:00:00.000Z',
    updated_at: new Date().toISOString(),
  };
}

/** Los mocks de músculos y grupos musculares. Cuáles están encendidos lo dice `registry.ts`. */
export const muscleMocks = [
  // Los listados son REALES y públicos: responden solo a la sesión de una cuenta de demo. `muscles/all`
  // trae el grupo anidado y `mg/all` los músculos de cada grupo, aunque el contrato no lo declare (V9).
  mockPendingEndpoint<undefined, MuscleWithGroup[]>(
    'get',
    '/api/v1/muscles/all',
    () =>
      demoAccountForSession()
        ? HttpResponse.json(musclesWithGroup())
        : passthrough(),
  ),
  mockEndpoint('get', '/api/v1/muscles/mg/all', () =>
    demoAccountForSession()
      ? HttpResponse.json(groupsWithMuscles())
      : passthrough(),
  ),

  // Alta, edición y borrado son solo del Admin y se mockean para las cuentas de demo.
  mockEndpoint('post', '/api/v1/muscles/create', async ({ request }) => {
    const denied = adminAccess(request);
    if (denied) return denied;

    const body = await request.json();
    const errors = validate(body);
    if (errors.length > 0) return guardError(400, errors);
    if (!demoMuscleGroups.some(({ id }) => id === body.muscle_group_id)) {
      return serviceError(404, 'Grupo muscular no encontrado');
    }

    const created: DemoMuscle = {
      id: `demo-muscle-${crypto.randomUUID()}`,
      groupId: body.muscle_group_id,
      name: body.name,
      description: body.description,
      image_url: body.image_url,
      preview_image: body.preview_image,
    };
    demoMuscles.push(created);
    return HttpResponse.json(toMuscle(created), { status: 201 });
  }),

  mockEndpoint(
    'post',
    '/api/v1/muscles/edit/{id}',
    async ({ request, params }) => {
      const denied = adminAccess(request);
      if (denied) return denied;

      const muscle = muscleById(params.id);
      if (!muscle) return serviceError(404, 'Músculo no encontrado');
      const body = await request.json();
      const errors = validate(body);
      if (errors.length > 0) return guardError(400, errors);
      if (!demoMuscleGroups.some(({ id }) => id === body.muscle_group_id)) {
        return serviceError(404, 'Grupo muscular no encontrado');
      }

      // Como `editMuscle`: lo que no viene no se toca, y `null` borra el dato.
      muscle.groupId = body.muscle_group_id;
      muscle.name = body.name;
      for (const field of TEXT_FIELDS) {
        const value: string | null | undefined = body[field];
        if (value !== undefined) muscle[field] = value ?? undefined;
      }
      return HttpResponse.json(toMuscle(muscle), { status: 201 });
    },
  ),

  mockEndpoint('delete', '/api/v1/muscles/{id}', ({ request, params }) => {
    const denied = adminAccess(request);
    if (denied) return denied;

    const index = demoMuscles.findIndex(({ id }) => id === params.id);
    if (index === -1) return serviceError(404, 'Músculo no encontrado');
    // Como el backend: el vínculo con los ejercicios (`Exercised_Muscle`) se borra en cascada, así que
    // un músculo en uso se elimina igual y los ejercicios lo pierden.
    demoMuscles.splice(index, 1);
    return emptyResponse();
  }),
];
