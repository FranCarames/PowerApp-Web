import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';

import { Icon } from '@/shared/icons';
import { cx } from '@/shared/lib/cx';
import { Button, IconButton, Pill, SelectMark } from '@/shared/ui';

import { dropIndex, routinesCount, type WeekRoutine } from '../planRoutines';
import styles from './PlanWeekCard.module.css';

/** Cómo se movió una rutina: arrastrando su grabber o con las flechas del teclado. */
export type MoveHow = 'drag' | 'key';

interface PlanWeekCardProps {
  week: number;
  routines: WeekRoutine[];
  /** Las rutinas por semana: cuántos huecos tiene la semana. 0 si el campo no tiene un número válido. */
  slots: number;
  folded: boolean;
  onToggleFold: () => void;
  /** Con el plan dado de baja se ve todo, pero no se cambia nada. */
  disabled?: boolean;
  /** Ofrece «Repetir en las otras semanas»: el plan dura más de una semana. */
  canRepeat: boolean;
  /** Si se están eligiendo rutinas para quitarlas en lote: las filas pasan a ser interruptores. */
  selecting?: boolean;
  selected?: ReadonlySet<string>;
  onToggleSelect?: (key: string) => void;
  /** El `id` del texto oculto que explica el grabber (lo comparten todas las tarjetas). */
  grabHintId: string;
  onAdd: () => void;
  onRemove: (routine: WeekRoutine) => void;
  /** Lleva la rutina del lugar `from` al `to` de su semana. */
  onMove: (from: number, to: number, how: MoveHow) => void;
  onRepeat: () => void;
}

/** Un arrastre en curso: qué fila se mueve y en qué hueco de la lista se soltaría (0 es antes de la primera). */
interface Drag {
  from: number;
  at: number | null;
}

/**
 * Una semana del plan (CU-E-09 y CU-E-12): su título, cuántas rutinas tiene de las que lleva por semana,
 * sus rutinas (con el grabber para ordenarlas, su posición, su nombre y la cruz para quitarlas), los huecos
 * que faltan para llegar a las rutinas por semana y, si ya los llenó, «Agregar otra rutina»: las rutinas por
 * semana definen los huecos, no son un tope. Con rutinas ofrece también «Repetir en las otras semanas».
 *
 * La tarjeta es la misma en el alta (el borrador) y en la edición (el plan guardado): no sabe qué pasa con
 * lo que se hace en ella, solo lo avisa. Ordenar se hace **dentro** de la semana:
 * - con el mouse o el dedo, arrastrando el grabber de la fila y soltándola donde va;
 * - con el teclado, con el foco en el grabber (es un botón): ↑ y ↓ la mueven de a un lugar y el foco se
 *   queda en ella.
 */
export function PlanWeekCard({
  week,
  routines,
  slots,
  folded,
  onToggleFold,
  disabled = false,
  canRepeat,
  selecting = false,
  selected,
  onToggleSelect,
  grabHintId,
  onAdd,
  onRemove,
  onMove,
  onRepeat,
}: PlanWeekCardProps) {
  const titleId = useId();
  const count = routines.length;
  const free = Math.max(0, slots - count);
  const [drag, setDrag] = useState<Drag | null>(null);
  const listRef = useRef<HTMLOListElement>(null);
  // Mover una fila con el teclado la cambia de lugar en el DOM y el navegador le saca el foco: se lo devuelve.
  const grabs = useRef(new Map<string, HTMLButtonElement>());
  const refocus = useRef<string | null>(null);

  useEffect(() => {
    const key = refocus.current;
    if (key === null) return;
    refocus.current = null;
    grabs.current.get(key)?.focus();
  });

  function startDrag(event: PointerEvent<HTMLButtonElement>, index: number) {
    // Solo el botón principal del mouse, el dedo o el lápiz.
    if (event.button > 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({ from: index, at: null });
  }

  function overDrag(event: PointerEvent<HTMLButtonElement>) {
    if (!drag) return;
    const row = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLElement>('[data-row]');
    // Solo se puede soltar dentro de la misma semana.
    if (!row || !listRef.current?.contains(row)) {
      setDrag({ from: drag.from, at: null });
      return;
    }
    const box = row.getBoundingClientRect();
    const after = event.clientY > box.top + box.height / 2;
    setDrag({ from: drag.from, at: Number(row.dataset.row) + (after ? 1 : 0) });
  }

  function endDrag() {
    if (!drag) return;
    const { from, at } = drag;
    setDrag(null);
    if (at === null) return;
    const to = dropIndex(from, at);
    // Soltarla donde estaba no cambia nada ni manda nada.
    if (to !== from) onMove(from, to, 'drag');
  }

  function keyMove(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    event.preventDefault();
    const to = index + (event.key === 'ArrowUp' ? -1 : 1);
    // Más allá de un extremo no hay nada que mover.
    if (to < 0 || to >= count) return;
    refocus.current = routines[index]?.key ?? null;
    onMove(index, to, 'key');
  }

  const addLabel = count > 0 ? 'Agregar otra rutina' : 'Agregar rutina';

  return (
    <section aria-labelledby={titleId} className={styles.card}>
      <div className={styles.head}>
        <h5 id={titleId} className={styles.title}>
          Semana {week}
        </h5>
        <span className={styles.count}>
          {slots > 0 ? `${count} de ${slots}` : routinesCount(count)}
        </span>
        <IconButton
          variant="ghost"
          icon={folded ? 'chevD' : 'chevU'}
          label={`${folded ? 'Mostrar' : 'Plegar'} la semana ${week}`}
          aria-expanded={!folded}
          onClick={onToggleFold}
        />
      </div>
      {!folded && (
        <>
          {count > 0 && (
            <ol ref={listRef} className={styles.list}>
              {routines.map((routine, index) => {
                if (selecting) {
                  const on = selected?.has(routine.key) ?? false;
                  return (
                    <li key={routine.key} data-row={index}>
                      <button
                        type="button"
                        className={cx(styles.pick, on && styles.picked)}
                        aria-pressed={on}
                        onClick={() => onToggleSelect?.(routine.key)}
                      >
                        <span className={styles.pos}>{routine.position}</span>
                        <RoutineLabel routine={routine} />
                        <SelectMark checked={on} />
                      </button>
                    </li>
                  );
                }
                return (
                  <li
                    key={routine.key}
                    data-row={index}
                    className={cx(
                      styles.row,
                      drag?.from === index && styles.dragging,
                      drag?.at === index && styles.dropBefore,
                      drag?.at === count &&
                        index === count - 1 &&
                        styles.dropAfter,
                    )}
                  >
                    <button
                      type="button"
                      ref={(element) => {
                        if (element) grabs.current.set(routine.key, element);
                        else grabs.current.delete(routine.key);
                      }}
                      className={styles.grab}
                      aria-label={`Mover ${routine.name}, posición ${index + 1} de ${count}`}
                      aria-describedby={grabHintId}
                      disabled={disabled}
                      onPointerDown={(event) => startDrag(event, index)}
                      onPointerMove={overDrag}
                      onPointerUp={endDrag}
                      onPointerCancel={() => setDrag(null)}
                      onKeyDown={(event) => keyMove(event, index)}
                    >
                      <Icon name="grip" size={18} />
                    </button>
                    <span className={styles.pos}>{routine.position}</span>
                    <RoutineLabel routine={routine} />
                    <IconButton
                      variant="ghost"
                      danger
                      icon="x"
                      label={`Quitar ${routine.name} de la semana ${week}`}
                      disabled={disabled}
                      onClick={() => onRemove(routine)}
                    />
                  </li>
                );
              })}
            </ol>
          )}
          {!selecting && (
            <>
              {Array.from({ length: free }, (_, slot) => (
                <button
                  key={slot}
                  type="button"
                  className={styles.slot}
                  disabled={disabled}
                  aria-label={`Agregar una rutina a la semana ${week}`}
                  title={`Agregar rutina · Posición ${count + slot + 1}`}
                  onClick={onAdd}
                >
                  <span className={styles.slotPos}>{count + slot + 1}</span>
                  <Icon name="plus" size={16} />
                  Agregar rutina
                </button>
              ))}
              {free === 0 && (
                <button
                  type="button"
                  className={cx(styles.slot, styles.more)}
                  disabled={disabled}
                  aria-label={`Agregar ${count > 0 ? 'otra' : 'una'} rutina a la semana ${week}`}
                  onClick={onAdd}
                >
                  <Icon name="plus" size={16} />
                  {addLabel}
                </button>
              )}
              {count > 0 && canRepeat && (
                <Button
                  variant="ghost"
                  sm
                  icon="copy"
                  className={styles.repeat}
                  disabled={disabled}
                  onClick={onRepeat}
                >
                  Repetir en las otras semanas
                </Button>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}

/** El nombre de la rutina y, si la dieron de baja pero sigue en el plan, «Rutina inactiva». */
function RoutineLabel({ routine }: { routine: WeekRoutine }) {
  return (
    <span className={styles.label}>
      <span className={cx(styles.name, routine.inactive && styles.inactive)}>
        {routine.name}
      </span>
      {routine.inactive && <Pill tone="warn">Rutina inactiva</Pill>}
    </span>
  );
}
