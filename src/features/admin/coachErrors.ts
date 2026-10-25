import { isApiError } from '@/api/errors';
import type { Coach } from '@/api/types';

/** Los campos de los datos profesionales que no se pueden repetir entre entrenadores (CU-A-17 y CU-A-18). */
export type CoachUniqueField = 'coach_email' | 'cuil';

/** El aviso de cada dato repetido, junto a su campo. */
export const DUPLICATE_COACH_MESSAGE: Record<CoachUniqueField, string> = {
  coach_email: 'Ya hay otro entrenador con ese email profesional',
  cuil: 'Ya hay otro entrenador con ese CUIL',
};

const onlyDigits = (cuil: string) => cuil.replace(/\D/g, '');

/**
 * El dato que ya usa otro entrenador, entre los que se conocen (también los dados de baja, que cuentan
 * como repetidos): primero el email y después el CUIL, como los informa el backend. Los del propio
 * usuario no cuentan. `null` si no se repite ninguno.
 */
export function takenCoachField(
  coaches: readonly Coach[] | undefined,
  ownId: string,
  values: { coach_email: string; cuil: string },
): CoachUniqueField | null {
  const others = coaches?.filter(({ id }) => id !== ownId) ?? [];
  if (
    others.some(
      ({ coach_email }) => coach_email.toLowerCase() === values.coach_email,
    )
  ) {
    return 'coach_email';
  }
  if (others.some(({ cuil }) => onlyDigits(cuil) === values.cuil)) {
    return 'cuil';
  }
  return null;
}

/**
 * Qué dato repetido dice un 409 de `promote_user` ("Ya existe un entrenador con ese email profesional" o
 * "… con ese CUIL"). Se reconoce por el texto del servidor, que no se muestra tal cual. `null` si no es un
 * 409 o no se reconoce cuál es.
 */
export function duplicateCoachField(error: unknown): CoachUniqueField | null {
  if (!isApiError(error) || error.status !== 409) return null;
  const text = (error.serverMessage ?? '').toLowerCase();
  if (text.includes('cuil')) return 'cuil';
  if (text.includes('email')) return 'coach_email';
  return null;
}
