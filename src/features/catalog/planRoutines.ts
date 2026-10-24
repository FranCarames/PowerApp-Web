import type { PlanificationAsignation } from '@/api/types';

import { PLAN_INT_MAX } from './planSchema';

/** Las rutinas de una semana del plan, en el orden en que las manda el backend (por posición y por fecha de alta). */
export interface PlanWeek {
  week: number;
  routines: PlanificationAsignation[];
}

/**
 * Agrupa por semana la lista plana de rutinas del plan, con las semanas de menor a mayor. Dentro de cada
 * semana conserva el orden del backend: la posición es una etiqueta que puede repetirse, y a igual
 * posición el backend ya pone primero a la que se asignó antes.
 */
export function groupByWeek(
  routines: readonly PlanificationAsignation[],
): PlanWeek[] {
  const weeks = new Map<number, PlanificationAsignation[]>();
  for (const routine of routines) {
    const week = weeks.get(routine.week);
    if (week) week.push(routine);
    else weeks.set(routine.week, [routine]);
  }
  return [...weeks]
    .sort(([a], [b]) => a - b)
    .map(([week, items]) => ({ week, routines: items }));
}

/** La semana más alta que ocupa alguna de las rutinas vigentes, o 0 si no hay ninguna. */
export function maxWeekOf(
  routines: readonly PlanificationAsignation[],
): number {
  return routines.reduce((max, { week }) => Math.max(max, week), 0);
}

/** La semana más alta que admite el plan: su duración, o sin tope (el de un entero de la base) si no tiene duración fija. */
export function weekLimit(duration: number): number {
  return duration > 0 ? duration : PLAN_INT_MAX;
}

const INTEGER = /^\d+$/;

/**
 * La semana escrita en un campo: un entero de 1 a `limit`. Devuelve el número o el mensaje de por qué no
 * sirve (el campo vacío es un error).
 */
export function parseWeek(
  text: string,
  duration: number,
): { week: number } | { error: string } {
  const value = text.trim();
  if (value === '') return { error: 'Indicá la semana' };
  if (!INTEGER.test(value) || Number(value) < 1) {
    return { error: 'Poné un número entero de semana, de 1 en adelante' };
  }
  if (Number(value) > weekLimit(duration)) {
    return {
      error: `El plan dura ${duration} semana${duration === 1 ? '' : 's'}: la semana va de 1 a ${duration}`,
    };
  }
  return { week: Number(value) };
}

/**
 * La posición escrita en un campo opcional: un entero de 1 en adelante. Vacía no es un error (va al final
 * de la semana) y devuelve `undefined`.
 */
export function parseOrder(
  text: string,
): { order: number | undefined } | { error: string } {
  const value = text.trim();
  if (value === '') return { order: undefined };
  if (
    !INTEGER.test(value) ||
    Number(value) < 1 ||
    Number(value) > PLAN_INT_MAX
  ) {
    return { error: 'Poné un número entero de posición, de 1 en adelante' };
  }
  return { order: Number(value) };
}

/** "1 rutina" o "3 rutinas". */
export function routinesCount(count: number): string {
  return `${count} rutina${count === 1 ? '' : 's'}`;
}
