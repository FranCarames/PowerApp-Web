import { useRef, useState } from 'react';

import {
  lastUsedWeek,
  moveItem,
  repeatDraftWeek,
  resizeDraft,
  type DraftRoutine,
  type DraftWeeks,
} from '../planRoutines';

/**
 * Las semanas que se arman en el alta de una planificación (CU-E-09, regla 2): elegir, quitar, ordenar y
 * repetir rutinas **no mandan nada** al backend, solo cambian este borrador. «Crear planificación» lo manda
 * junto con la cabecera, todo o nada. El índice 0 es la semana 1.
 */
export function usePlanDraftWeeks(initialWeeks: number) {
  const [weeks, setWeeks] = useState<DraftWeeks>(() =>
    resizeDraft([], initialWeeks),
  );
  const keys = useRef(0);
  const newKey = () => `draft-${++keys.current}`;

  return {
    weeks,
    /** La semana más alta que ya tiene alguna rutina: la duración no puede bajar de ahí. */
    lastUsed: lastUsedWeek(weeks),
    /** Deja el borrador con esa cantidad de semanas, sin perder lo elegido en las que quedan. */
    resize: (count: number) =>
      setWeeks((current) => resizeDraft(current, count)),
    /** Suma rutinas al final de la semana, en el orden dado. */
    add: (week: number, routines: readonly { id: string; name: string }[]) =>
      setWeeks((current) =>
        current.map((items, index) =>
          index === week - 1
            ? [
                ...items,
                ...routines.map(({ id, name }): DraftRoutine => ({
                  key: newKey(),
                  id,
                  name,
                })),
              ]
            : items,
        ),
      ),
    remove: (week: number, key: string) =>
      setWeeks((current) =>
        current.map((items, index) =>
          index === week - 1 ? items.filter((item) => item.key !== key) : items,
        ),
      ),
    /** Lleva la rutina de un lugar a otro de su semana. */
    move: (week: number, from: number, to: number) =>
      setWeeks((current) =>
        current.map((items, index) =>
          index === week - 1 ? (moveItem(items, from, to) ?? items) : items,
        ),
      ),
    /** Copia las rutinas de una semana al final de cada una de las elegidas. */
    repeat: (from: number, targets: readonly number[]) =>
      setWeeks((current) => repeatDraftWeek(current, from, targets, newKey)),
  };
}

export type PlanDraftWeeks = ReturnType<typeof usePlanDraftWeeks>;
