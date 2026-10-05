import { passthrough } from 'msw';
import { HttpResponse } from 'msw/http';

import type { ExerciseWithMuscles } from '@/api/pending';
import type { Exercise } from '@/api/types';

import { adminAccess } from '../access';
import { mockEndpoint } from '../endpoint';
import { EXERCISES_IN_USE, exercises } from '../fixtures/exercises';
import { muscleById, toExerciseMuscle } from '../fixtures/muscles';
import { demoAccountForSession, demoAccountForToken } from '../fixtures/users';
import { emptyResponse, guardError, serviceError } from '../responses';

// Los ejercicios de demo viven en memoria: lo que el Admin crea, edita o borra se ve en las demás
// pantallas hasta que se recarga la página.
// Cada ejercicio guarda los ids de sus músculos y los resuelve al responder: así un músculo que se
// edita o se borra desde el Catálogo se ve igual acá (el backend borra el vínculo en cascada).
type StoredExercise = Omit<ExerciseWithMuscles, 'exercisedMuscles'> & {
  muscleIds: string[];
};

const catalog: StoredExercise[] = exercises.map(
  ({ exercisedMuscles, ...exercise }) => ({
    ...exercise,
    muscleIds: exercisedMuscles.map(({ id }) => id),
  }),
);

/** Un ejercicio como lo manda `GET /exercise/all`: con sus músculos de ahora. */
function view({ muscleIds, ...exercise }: StoredExercise): ExerciseWithMuscles {
  return {
    ...exercise,
    exercisedMuscles: muscleIds.flatMap((id) => {
      const muscle = muscleById(id);
      return muscle ? [toExerciseMuscle(muscle)] : [];
    }),
  };
}

/** Un `Exercise` sin los músculos, como lo devuelven el alta y la edición. */
function withoutMuscles(exercise: StoredExercise): Exercise {
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

/** Si todos los músculos existen: si no, el backend responde 404. */
function allMusclesExist(ids: readonly string[]): boolean {
  return ids.every((id) => muscleById(id) !== undefined);
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
    demoAccountForSession()
      ? HttpResponse.json(catalog.map(view))
      : passthrough(),
  ),

  // Leer un ejercicio pide sesión (cualquier rol): responde solo al token de una cuenta de demo.
  mockEndpoint('get', '/api/v1/exercise/{id}', ({ request, params }) => {
    if (!demoAccountForToken(request.headers.get('Authorization'))) {
      return passthrough();
    }
    const exercise = catalog.find(({ id }) => id === params.id);
    return exercise
      ? HttpResponse.json(view(exercise))
      : serviceError(404, 'Ejercicio no encontrado');
  }),

  // Alta, edición y borrado son solo del Admin y se mockean para las cuentas de demo.
  mockEndpoint('post', '/api/v1/exercise/create', async ({ request }) => {
    const denied = adminAccess(request);
    if (denied) return denied;

    const body = await request.json();
    const errors = validate(body);
    if (errors.length > 0) return guardError(400, errors);
    if (!allMusclesExist(body.exercised_muscles_ids)) {
      return serviceError(404, 'Algunos músculos no fueron encontrados');
    }

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
      muscleIds: body.exercised_muscles_ids,
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
      if (!allMusclesExist(body.exercised_muscles_ids)) {
        return serviceError(404, 'Algunos músculos no fueron encontrados');
      }

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
        muscleIds: body.exercised_muscles_ids,
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
