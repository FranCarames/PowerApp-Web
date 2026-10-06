import { passthrough } from 'msw';
import { HttpResponse } from 'msw/http';

import type { EditCoachRequest } from '@/api/pending';
import type { Coach } from '@/api/types';

import { adminAccess } from '../access';
import { mockEndpoint, mockPendingEndpoint } from '../endpoint';
import { coaches } from '../fixtures/coaches';
import { demoAccountForSession } from '../fixtures/users';
import { guardError, serviceError } from '../responses';
import { findMockUser, setMockUserRole } from './users';

// Los registros de Coach, con las altas y las bajas hechas con `POST /coach/promote_user` y
// `POST /coach/delete_coach/{id}` (id → Coach). Vive en memoria: al recargar la página vuelve a ser la
// de la fixture. El backend no saca de la lista a un entrenador dado de baja: queda con `active: false`.
const records = new Map<string, Coach>(
  coaches.map((coach) => [coach.id, coach]),
);

function currentCoaches(): Coach[] {
  return [...records.values()];
}

// El backend de verdad responde 500 por cualquier falla al dar de baja. Con este entrenador de demo
// (Martín) el mock lo hace, para ver cómo la pantalla lo muestra.
const FAILING_COACH_ID = coaches[2].id;

const MAX_EMAIL_LENGTH = 50;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Los errores de los dos datos profesionales, con las reglas de `PromoteCoachDto`. */
function dataErrors({ coach_email, cuil }: Record<string, unknown>): string[] {
  return [
    ...(typeof coach_email === 'string' &&
    coach_email !== '' &&
    coach_email.length <= MAX_EMAIL_LENGTH &&
    EMAIL.test(coach_email)
      ? []
      : ['coach_email must be an email']),
    ...(typeof cuil === 'string' && cuil.length === 11
      ? []
      : ['El CUIL debe tener exactamente 11 caracteres']),
  ];
}

/** Los errores de `PromoteCoachDto` (el id no se valida como UUID: los de demo no lo son). */
function promoteErrors(body: unknown): string[] {
  const { user_id, ...data } = (body ?? {}) as Record<string, unknown>;
  const { coach_email, cuil, ...extra } = data;
  return [
    ...Object.keys(extra).map((key) => `property ${key} should not exist`),
    ...(typeof user_id === 'string' && user_id !== ''
      ? []
      : ['user_id should not be empty']),
    ...dataErrors({ coach_email, cuil }),
  ];
}

/** Los errores del body de la edición: los dos datos y nada más (el DTO propuesto no tiene otros campos). */
function editErrors(body: unknown): string[] {
  const { coach_email, cuil, ...extra } = (body ?? {}) as Record<
    string,
    unknown
  >;
  return [
    ...Object.keys(extra).map((key) => `property ${key} should not exist`),
    ...dataErrors({ coach_email, cuil }),
  ];
}

/** Los mocks de entrenadores. Cuáles están encendidos lo dice `registry.ts`. */
export const coachMocks = [
  // El listado es REAL y público: igual que el de ejercicios, responde solo a la sesión de una cuenta
  // de demo.
  mockEndpoint('get', '/api/v1/coach/all', () =>
    demoAccountForSession()
      ? HttpResponse.json(currentCoaches())
      : passthrough(),
  ),

  // Leer un entrenador es REAL y público: igual, responde solo a la sesión de una cuenta de demo.
  mockEndpoint('get', '/api/v1/coach/get/{id}', ({ params }) => {
    if (!demoAccountForSession()) return passthrough();
    const coach = records.get(params.id);
    return coach
      ? HttpResponse.json(coach)
      : serviceError(404, 'Entrenador no encontrado');
  }),

  // Convertir a un usuario en entrenador es REAL y solo del Admin (el entrenador de demo recibe el 403
  // de un guard). Como el backend: valida el body, crea el Coach o reactiva el que ya tenía (y le pisa el
  // email y el CUIL) y le pone el rol `coach` al usuario. No mira el rol ni el estado de la cuenta. El
  // rol cambia ANTES de guardar el Coach: un email que ya usa otro entrenador es un 500 que deja al
  // usuario con el rol y sin sus datos.
  mockEndpoint('post', '/api/v1/coach/promote_user', async ({ request }) => {
    const denied = adminAccess(request);
    if (denied) return denied;

    const body = await request.clone().json();
    const errors = promoteErrors(body);
    if (errors.length > 0) return guardError(400, errors);

    const user = findMockUser(body.user_id);
    if (!user) return serviceError(404, 'Usuario no encontrado');

    const coach_email = body.coach_email.toLowerCase();
    setMockUserRole(user.id, 'coach');
    const taken = currentCoaches().some(
      (other) => other.id !== user.id && other.coach_email === coach_email,
    );
    if (taken) return serviceError(500, 'Error al promover al entrenador');

    const now = new Date().toISOString();
    const coach: Coach = {
      created_at: now,
      ...records.get(user.id),
      id: user.id,
      coach_email,
      cuil: body.cuil,
      active: true,
      updated_at: now,
    };
    records.set(user.id, coach);
    return HttpResponse.json({ ...user, role: 'coach', coach });
  }),

  // PENDIENTE-CONTRATO: B8 CU-A-18. Editar el email profesional y el CUIL de un entrenador: el endpoint no
  // existe en el contrato, así que el path y la respuesta (el `Coach` guardado) son una propuesta del
  // front. Solo el Admin (el entrenador de demo recibe el 403 de un guard). Imita a los demás edit: valida
  // el body, 404 si no hay Coach y 500 genérico si el email ya lo usa otro entrenador (columna única).
  mockPendingEndpoint<EditCoachRequest, Coach>(
    'post',
    '/api/v1/coach/edit/{id}',
    async ({ request, params }) => {
      const denied = adminAccess(request);
      if (denied) return denied;

      const body = await request.clone().json();
      const errors = editErrors(body);
      if (errors.length > 0) return guardError(400, errors);

      const coach = records.get(params.id);
      if (!coach) return serviceError(404, 'Coach no encontrado');

      const coach_email = body.coach_email.toLowerCase();
      const taken = currentCoaches().some(
        (other) => other.id !== coach.id && other.coach_email === coach_email,
      );
      if (taken) return serviceError(500, 'Error al editar al entrenador');

      const edited: Coach = {
        ...coach,
        coach_email,
        cuil: body.cuil,
        updated_at: new Date().toISOString(),
      };
      records.set(coach.id, edited);
      return HttpResponse.json(edited);
    },
  ),

  // Dar de baja a un entrenador es REAL y solo del Admin (el entrenador de demo recibe el 403 de un
  // guard). Como el backend: marca el Coach como inactivo y le devuelve el rol `user` a su usuario; un
  // id sin usuario o sin Coach es un 404 (con dos textos distintos), y repetirlo no falla.
  mockEndpoint(
    'post',
    '/api/v1/coach/delete_coach/{id}',
    ({ request, params }) => {
      const denied = adminAccess(request);
      if (denied) return denied;

      const user = findMockUser(params.id);
      if (!user) return serviceError(404, 'Usuario no encontrado');
      const coach = records.get(params.id);
      if (!coach) return serviceError(404, 'Coach no encontrado');
      if (params.id === FAILING_COACH_ID) {
        return serviceError(500, 'Error al eliminar al entrenador');
      }

      const removed = { ...coach, active: false };
      records.set(coach.id, removed);
      setMockUserRole(user.id, 'user');
      return HttpResponse.json({ ...user, role: 'user', coach: removed });
    },
  ),
];
