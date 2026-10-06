import { passthrough } from 'msw';
import { HttpResponse } from 'msw/http';

import type { Coach } from '@/api/types';

import { adminAccess } from '../access';
import { mockEndpoint } from '../endpoint';
import { coaches } from '../fixtures/coaches';
import { demoAccountForSession } from '../fixtures/users';
import { serviceError } from '../responses';
import { findMockUser, setMockUserRole } from './users';

// Los entrenadores dados de baja con `POST /coach/delete_coach/{id}` (ids). Vive en memoria: al
// recargar la página vuelven a ser los de la fixture.
const removedCoaches = new Set<string>();

/** Los registros de Coach con las bajas hechas al día. El backend no los saca de la lista: quedan con `active: false`. */
function currentCoaches(): Coach[] {
  return coaches.map((coach) =>
    removedCoaches.has(coach.id) ? { ...coach, active: false } : coach,
  );
}

// El backend de verdad responde 500 por cualquier falla al dar de baja. Con este entrenador de demo
// (Martín) el mock lo hace, para ver cómo la pantalla lo muestra.
const FAILING_COACH_ID = coaches[2].id;

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
    const coach = currentCoaches().find(({ id }) => id === params.id);
    return coach
      ? HttpResponse.json(coach)
      : serviceError(404, 'Entrenador no encontrado');
  }),

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
      const coach = coaches.find(({ id }) => id === params.id);
      if (!coach) return serviceError(404, 'Coach no encontrado');
      if (params.id === FAILING_COACH_ID) {
        return serviceError(500, 'Error al eliminar al entrenador');
      }

      removedCoaches.add(coach.id);
      setMockUserRole(user.id, 'user');
      return HttpResponse.json({
        ...user,
        role: 'user',
        coach: { ...coach, active: false },
      });
    },
  ),
];
