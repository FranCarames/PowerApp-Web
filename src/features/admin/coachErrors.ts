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

/** Por qué el backend no convierte a alguien en entrenador (CU-A-17): un 400 de `promote_user`. */
export type NotConvertibleReason = 'inactive' | 'admin';

const NOT_CONVERTIBLE_SERVER_MESSAGE: Record<NotConvertibleReason, string> = {
  inactive: 'No se puede convertir en entrenador a una cuenta inactiva.',
  admin: 'No se puede convertir en entrenador a un administrador.',
};

/**
 * El aviso de cada motivo, con el nombre de a quien se quiso convertir. Lo usan la pantalla (al elegir
 * a alguien que ya se sabe que no se puede) y el formulario (cuando el backend lo rechaza).
 */
export function notConvertibleMessage(
  reason: NotConvertibleReason,
  name: string,
): string {
  return reason === 'inactive'
    ? `La cuenta de ${name} está inactiva. Reactivala desde Usuarios para poder convertirla en entrenador.`
    : `${name} es admin y no se puede convertir.`;
}

/**
 * Qué motivo dice un 400 de `promote_user` (BE-41): el texto exacto del servidor, que no se muestra tal
 * cual. `null` si no es un 400 o es otro (datos inválidos).
 */
export function notConvertibleReason(
  error: unknown,
): NotConvertibleReason | null {
  if (!isApiError(error) || error.status !== 400) return null;
  const reason = (
    Object.keys(NOT_CONVERTIBLE_SERVER_MESSAGE) as NotConvertibleReason[]
  ).find((key) => NOT_CONVERTIBLE_SERVER_MESSAGE[key] === error.serverMessage);
  return reason ?? null;
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
