import { HttpResponse } from 'msw/http';

import { isCalendarDay, toCalendarDay } from '@/shared/lib/dates';

import { userAccess } from '../access';
import { mockEndpoint } from '../endpoint';
import { demoHomeWeeks } from '../fixtures/home';
import { guardError } from '../responses';

/** Los mocks del home del alumno. Cuáles están encendidos lo dice `registry.ts`. */
export const routineHomeMocks = [
  // El home es REAL: el mock atiende solo a las cuentas de demo, por su token falso. Imita al
  // backend: el alumno solo ve lo suyo (403), un día o una cantidad de semanas inválidos dan 400, y
  // siempre responde `week` semanas (por defecto 1), aunque estén vacías. Sin `date`, hoy.
  mockEndpoint(
    'get',
    '/api/v1/routine/home/{userId}',
    ({ request, params }) => {
      const access = userAccess(request);
      if ('denied' in access) return access.denied;
      if (params.userId !== access.account.user.id) {
        return guardError(
          403,
          'Un alumno sólo puede acceder a sus propios datos',
        );
      }

      const query = new URL(request.url).searchParams;
      const date = query.get('date') ?? toCalendarDay();
      const weekParam = query.get('week');
      const weeks = weekParam === null ? 1 : Number(weekParam);

      const errors: string[] = [];
      if (!isCalendarDay(date)) {
        errors.push('date must be a valid ISO 8601 date string');
      }
      if (!Number.isInteger(weeks) || weeks < 1 || weeks > 8) {
        errors.push('week must be an integer number from 1 to 8');
      }
      if (errors.length > 0) return guardError(400, errors);

      return HttpResponse.json(
        demoHomeWeeks(access.account.user.id, date, weeks),
      );
    },
  ),
];
