import type {
  CreatePlanificationBody,
  PlanificationAsignation,
  PlanificationDetail,
} from '@/api/types';

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

/**
 * Una rutina dentro de una semana, lista para mostrarse: la de un plan guardado (un vínculo del detalle) o la
 * de un borrador del alta. Las dos se dibujan con la misma tarjeta.
 */
export interface WeekRoutine {
  /** Identifica la fila: el id del vínculo en un plan guardado, uno propio en el borrador. */
  key: string;
  name: string;
  /** La etiqueta de orden. En un plan guardado es la `order` del vínculo (puede repetirse); en el borrador, el lugar. */
  position: number;
  /** La rutina está dada de baja pero sigue en el plan. */
  inactive: boolean;
}

/** Una semana del plan con sus rutinas, para dibujar su tarjeta. */
export interface WeekView {
  week: number;
  routines: WeekRoutine[];
}

/** Hasta cuántas semanas vacías se dibujan de un plan guardado: un tope de seguridad, para una duración descomunal. */
const SAVED_WEEKS_SHOWN_MAX = 520;

/**
 * Las semanas de un plan guardado: de la 1 a su duración, vacías incluidas, cada una con sus rutinas
 * vigentes en el orden del backend (CU-E-12, paso 2). Un plan viejo sin duración fija (0) no tiene semanas
 * que mostrar de antemano: se muestran las que tienen rutinas.
 */
export function savedWeeks(plan: PlanificationDetail): WeekView[] {
  const withRoutines = new Map(
    groupByWeek(plan.routines).map(({ week, routines }) => [week, routines]),
  );
  const weeks = new Set<number>(withRoutines.keys());
  for (
    let week = 1;
    week <= Math.min(plan.duration, SAVED_WEEKS_SHOWN_MAX);
    week++
  ) {
    weeks.add(week);
  }
  return [...weeks]
    .sort((a, b) => a - b)
    .map((week) => ({
      week,
      routines: (withRoutines.get(week) ?? []).map(
        ({ id, order, routine }) => ({
          key: id,
          name: routine.name,
          position: order,
          inactive: !routine.active,
        }),
      ),
    }));
}

/**
 * El detalle del plan con una semana en el orden nuevo, como lo va a dejar el backend (`reorder` la renumera
 * de 1 a n): se muestra sin esperar la respuesta. `ids` son los vínculos vigentes de la semana, en el orden
 * nuevo; las otras semanas no se tocan.
 */
export function reorderRoutines(
  plan: PlanificationDetail,
  week: number,
  ids: readonly string[],
): PlanificationDetail {
  const byId = new Map(plan.routines.map((link) => [link.id, link]));
  let next = 0;
  return {
    ...plan,
    routines: plan.routines.map((link) => {
      if (link.week !== week) return link;
      const id = ids[next++];
      const moved = id === undefined ? undefined : byId.get(id);
      return moved ? { ...moved, order: next } : link;
    }),
  };
}

/** Una rutina elegida para una semana del alta, que todavía no se guardó. */
export interface DraftRoutine {
  /** Identifica la fila mientras se arma: el borrador no tiene vínculos todavía. */
  key: string;
  /** El id de la rutina: es lo que se manda en `weeks`. */
  id: string;
  name: string;
}

/** Lo que se arma en el alta, por semana: el índice 0 es la semana 1. Vive solo en pantalla hasta crear. */
export type DraftWeeks = DraftRoutine[][];

/** El borrador con `count` semanas: las que sobran se sacan del final y las que faltan se suman vacías. */
export function resizeDraft(weeks: DraftWeeks, count: number): DraftWeeks {
  return weeks.length >= count
    ? weeks.slice(0, count)
    : [...weeks, ...Array.from({ length: count - weeks.length }, () => [])];
}

/** La semana más alta del borrador que tiene alguna rutina, o 0 si está vacío. */
export function lastUsedWeek(weeks: DraftWeeks): number {
  for (let index = weeks.length - 1; index >= 0; index--) {
    if (weeks[index]?.length) return index + 1;
  }
  return 0;
}

/** Cuántas rutinas hay elegidas en total en el borrador. */
export function draftTotal(weeks: DraftWeeks): number {
  return weeks.reduce((total, items) => total + items.length, 0);
}

/**
 * La lista con el elemento de `from` llevado a `to`, o `null` si no hay nada que mover: los dos lugares
 * son el mismo, o alguno está fuera de la lista.
 */
export function moveItem<T>(
  items: readonly T[],
  from: number,
  to: number,
): T[] | null {
  if (from === to || from < 0 || to < 0) return null;
  if (from >= items.length || to >= items.length) return null;
  const next = [...items];
  const [moved] = next.splice(from, 1);
  if (moved === undefined) return null;
  next.splice(to, 0, moved);
  return next;
}

/**
 * A qué lugar va el elemento `from` al soltarlo en el hueco `insertAt` (0 es antes del primero, n es
 * después del último). Quitarlo de su lugar corre un lugar a los que le siguen.
 */
export function dropIndex(from: number, insertAt: number): number {
  return insertAt > from ? insertAt - 1 : insertAt;
}

/**
 * El borrador con las rutinas de la semana `from` copiadas, en su orden, al final de cada semana de
 * `targets` (CU-E-12f). Las copias son filas nuevas: `newKey` les da su identificador.
 */
export function repeatDraftWeek(
  weeks: DraftWeeks,
  from: number,
  targets: readonly number[],
  newKey: () => string,
): DraftWeeks {
  const source = weeks[from - 1] ?? [];
  return weeks.map((items, index) =>
    targets.includes(index + 1)
      ? [...items, ...source.map((item) => ({ ...item, key: newKey() }))]
      : items,
  );
}

/** Las semanas del borrador como las pide `POST /planification/create`: solo las que tienen rutinas, en orden de semana. */
export function toCreateWeeks(
  weeks: DraftWeeks,
): NonNullable<CreatePlanificationBody['weeks']> {
  return weeks.flatMap((items, index) =>
    items.length
      ? [{ week: index + 1, routine_ids: items.map(({ id }) => id) }]
      : [],
  );
}

/** El entero de 1 en adelante que hay escrito en un campo, o 0 si está vacío o no es uno. */
export function parseCount(text: string): number {
  const value = text.trim();
  return INTEGER.test(value) && Number(value) >= 1 ? Number(value) : 0;
}
