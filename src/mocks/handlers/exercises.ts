import { passthrough } from 'msw';
import { HttpResponse } from 'msw/http';

import type { ExerciseWithMuscles } from '@/api/pending';
import type { Exercise } from '@/api/types';

import { adminAccess } from '../access';
import { mockEndpoint } from '../endpoint';
import { EXERCISES_IN_USE, exercises } from '../fixtures/exercises';
import { muscleGroups } from '../fixtures/muscles';
import { demoAccountForSession, demoAccountForToken } from '../fixtures/users';
import { emptyResponse, guardError, serviceError } from '../responses';

// Los ejercicios de demo viven en memoria: lo que el Admin crea, edita o borra se ve en las demás
// pantallas hasta que se recarga la página.
const catalog = [...exercises];

const knownMuscleIds = new Set(
  muscleGroups.flatMap(({ muscles }) => muscles.map(({ id }) => id)),
);

/** Un `Exercise` sin los músculos, como lo devuelven el alta y la edición. */
function withoutMuscles(exercise: ExerciseWithMuscles): Exercise {
  return {
    id: exercise.id,
    name: exercise.name,
    description: exercise.description,
    safety_tips: exercise.safety_tips,
    activation_tips: exercise.activation_tips,
    video_url: exercise.video_url,
    preview_image: exercise.preview_image,
    bg_image: exercise.bg_image,
    created_at: exercise.created_at,
    updated_at: exercise.updated_at,
  };
}

/** Los músculos de una lista de ids, o `null` si alguno no existe (el 404 del backend). */
function musclesOf(ids: readonly string[]) {
  if (!ids.every((id) => knownMuscleIds.has(id))) return null;
  return muscleGroups
    .flatMap(({ muscles }) => muscles)
    .filter(({ id }) => ids.includes(id));
}

/** Los errores de validación del DTO (`CreateExerciseDto` y `EditExerciseDto`, que son iguales). */
function validate(body: {
  name?: string;
  exercised_muscles_ids?: string[];
}): string[] {
  const errors: string[] = [];
  if (!body.name) errors.push('name should not be empty');
  else if (body.name.length > 50) {
    errors.push('name must be shorter than or equal to 50 characters');
  }
  if (!body.exercised_muscles_ids?.length) {
    errors.push('exercised_muscles_ids should not be empty');
  }
  return errors;
}

/** Los mocks de ejercicios. Cuáles están encendidos lo dice `registry.ts`. */
export const exerciseMocks = [
  // El listado es REAL y público: no lleva token, así que el mock mira la sesión y responde solo si
  // es la de una cuenta de demo. Con una cuenta de verdad, va al backend.
  mockEndpoint('get', '/api/v1/exercise/all', () =>
    demoAccountForSession() ? HttpResponse.json(catalog) : passthrough(),
  ),

  // Leer un ejercicio pide sesión (cualquier rol): responde solo al token de una cuenta de demo.
  mockEndpoint('get', '/api/v1/exercise/{id}', ({ request, params }) => {
    if (!demoAccountForToken(request.headers.get('Authorization'))) {
      return passthrough();
    }
    const exercise = catalog.find(({ id }) => id === params.id);
    return exercise
      ? HttpResponse.json(exercise)
      : serviceError(404, 'Ejercicio no encontrado');
  }),

  // Alta, edición y borrado son solo del Admin y se mockean para las cuentas de demo.
  mockEndpoint('post', '/api/v1/exercise/create', async ({ request }) => {
    const denied = adminAccess(request);
    if (denied) return denied;

    const body = await request.json();
    const errors = validate(body);
    if (errors.length > 0) return guardError(400, errors);
    const muscles = musclesOf(body.exercised_muscles_ids);
    if (!muscles)
      return serviceError(404, 'Algunos músculos no fueron encontrados');

    const now = new Date().toISOString();
    const created = {
      id: `demo-exercise-${crypto.randomUUID()}`,
      name: body.name,
      description: body.description ?? '',
      safety_tips: body.safety_tips,
      activation_tips: body.activation_tips,
      video_url: body.video_url,
      preview_image: body.preview_image,
      bg_image: body.bg_image,
      created_at: now,
      updated_at: now,
      exercisedMuscles: muscles,
    };
    catalog.push(created);
    return HttpResponse.json(withoutMuscles(created), { status: 201 });
  }),

  mockEndpoint(
    'post',
    '/api/v1/exercise/edit/{id}',
    async ({ request, params }) => {
      const denied = adminAccess(request);
      if (denied) return denied;

      const index = catalog.findIndex(({ id }) => id === params.id);
      if (index === -1) return serviceError(404, 'Ejercicio no encontrado');
      const body = await request.json();
      const errors = validate(body);
      if (errors.length > 0) return guardError(400, errors);
      const muscles = musclesOf(body.exercised_muscles_ids);
      if (!muscles)
        return serviceError(404, 'Algunos músculos no fueron encontrados');

      // Como el backend: lo que no viene se conserva, y no hay forma de vaciar un campo.
      const current = catalog[index];
      const edited = {
        ...current,
        name: body.name,
        description: body.description ?? current.description,
        safety_tips: body.safety_tips ?? current.safety_tips,
        activation_tips: body.activation_tips ?? current.activation_tips,
        video_url: body.video_url ?? current.video_url,
        preview_image: body.preview_image ?? current.preview_image,
        bg_image: body.bg_image ?? current.bg_image,
        updated_at: new Date().toISOString(),
        exercisedMuscles: muscles,
      };
      catalog[index] = edited;
      return HttpResponse.json(withoutMuscles(edited), { status: 201 });
    },
  ),

  mockEndpoint('delete', '/api/v1/exercise/{id}', ({ request, params }) => {
    const denied = adminAccess(request);
    if (denied) return denied;

    const index = catalog.findIndex(({ id }) => id === params.id);
    if (index === -1) return serviceError(404, 'Ejercicio no encontrado');
    // El backend no distingue el motivo: un RM o un entrenamiento hecho con el ejercicio rompe la
    // integridad y la respuesta es siempre este 500 (V7).
    if (EXERCISES_IN_USE.includes(params.id)) {
      return serviceError(500, 'Error al eliminar el ejercicio');
    }
    catalog.splice(index, 1);
    return emptyResponse();
  }),
];
