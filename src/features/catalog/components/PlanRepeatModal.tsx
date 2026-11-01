import { useState } from 'react';

import { joinWithAnd } from '@/shared/lib/text';
import { Button, Modal, Note, Pill, VisuallyHidden } from '@/shared/ui';

import { routinesCount } from '../planRoutines';
import styles from './PlanRepeatModal.module.css';

interface PlanRepeatModalProps {
  open: boolean;
  /** La semana que se repite y los nombres de sus rutinas, en su orden. */
  source: { week: number; names: string[] } | null;
  /** Todas las semanas del plan con cuántas rutinas tiene hoy cada una. */
  weeks: { week: number; count: number }[];
  /** Mientras se repite: el botón queda ocupado y el modal no se cierra. */
  submitting: boolean;
  /** Por qué falló el último intento, ya en español. */
  error?: string;
  onSubmit: (targets: number[]) => void;
  onClose: () => void;
}

/**
 * «Repetir la semana N» (CU-E-12f): copia las rutinas de una semana, en su orden, al final de las semanas que
 * se elijan. Hay una fila con casilla por cada **otra** semana del plan; las vacías vienen marcadas
 * («Queda igual a la semana N.») y en las que ya tienen rutinas, las nuevas se suman al final
 * («Ya tiene X rutinas: estas se suman al final.»). Sin ninguna elegida, el botón queda apagado.
 */
export function PlanRepeatModal({
  open,
  source,
  weeks,
  submitting,
  error,
  onSubmit,
  onClose,
}: PlanRepeatModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      blocking={submitting}
      title={source ? `Repetir la semana ${source.week}` : 'Repetir una semana'}
      description={
        source
          ? `${joinWithAnd(source.names)}, en ese orden. Elegí en qué semanas.`
          : undefined
      }
    >
      {/* El contenido solo existe con el modal abierto: la elección arranca de cero cada vez. */}
      {open && source && (
        <RepeatBody
          source={source}
          weeks={weeks}
          submitting={submitting}
          error={error}
          onSubmit={onSubmit}
          onClose={onClose}
        />
      )}
    </Modal>
  );
}

function RepeatBody({
  source,
  weeks,
  submitting,
  error,
  onSubmit,
  onClose,
}: Omit<PlanRepeatModalProps, 'open' | 'source'> & {
  source: NonNullable<PlanRepeatModalProps['source']>;
}) {
  const others = weeks.filter(({ week }) => week !== source.week);
  // Las vacías vienen marcadas: el caso común es repetir en las que todavía no se armaron.
  const [chosen, setChosen] = useState<ReadonlySet<number>>(
    () =>
      new Set(
        others.filter(({ count }) => count === 0).map(({ week }) => week),
      ),
  );

  function toggle(week: number) {
    setChosen((current) => {
      const next = new Set(current);
      if (!next.delete(week)) next.add(week);
      return next;
    });
  }

  return (
    <>
      {error && (
        <Note tone="err" icon="alert" role="alert">
          {error}
        </Note>
      )}
      <fieldset className={styles.fieldset}>
        <legend>
          <VisuallyHidden>Semanas donde se repite</VisuallyHidden>
        </legend>
        {others.map(({ week, count }) => (
          <label key={week} className={styles.row}>
            <input
              type="checkbox"
              checked={chosen.has(week)}
              disabled={submitting}
              onChange={() => toggle(week)}
            />
            <span className={styles.text}>
              <span className={styles.week}>Semana {week}</span>
              <span className={styles.hint}>
                {count > 0
                  ? `Ya tiene ${routinesCount(count)}: estas se suman al final.`
                  : `Queda igual a la semana ${source.week}.`}
              </span>
            </span>
            <Pill tone={count > 0 ? 'mut' : 'ok'}>
              {count > 0 ? routinesCount(count) : 'Vacía'}
            </Pill>
          </label>
        ))}
      </fieldset>
      <div className={styles.actions}>
        <Button
          loading={submitting}
          disabled={chosen.size === 0}
          onClick={() => onSubmit([...chosen].sort((a, b) => a - b))}
        >
          {chosen.size === 0
            ? 'Elegí una semana'
            : `Repetir en ${chosen.size} semana${chosen.size === 1 ? '' : 's'}`}
        </Button>
        <Button variant="ghost" disabled={submitting} onClick={onClose}>
          Cancelar
        </Button>
      </div>
    </>
  );
}
