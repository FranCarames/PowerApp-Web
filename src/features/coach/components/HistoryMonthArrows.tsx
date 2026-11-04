import { useEffect, useRef } from 'react';

import { IconButton } from '@/shared/ui';

import styles from './HistoryMonthArrows.module.css';

interface HistoryMonthArrowsProps {
  canGoBack: boolean;
  canGoForward: boolean;
  /** -1 es el mes anterior y 1 el siguiente. */
  onMove: (step: -1 | 1) => void;
}

/**
 * «Mes anterior» y «Mes siguiente» (6.2): botones de 40 px. Si la flecha tocada llega al extremo y se
 * deshabilita, el foco pasa a la otra (spec 11), para no perderlo en un botón apagado.
 */
export function HistoryMonthArrows({
  canGoBack,
  canGoForward,
  onMove,
}: HistoryMonthArrowsProps) {
  const previous = useRef<HTMLButtonElement>(null);
  const next = useRef<HTMLButtonElement>(null);
  // La flecha tocada por última vez, hasta que el render con el mes nuevo diga si quedó apagada.
  const touched = useRef<-1 | 1 | null>(null);

  useEffect(() => {
    if (touched.current === -1 && !canGoBack) next.current?.focus();
    if (touched.current === 1 && !canGoForward) previous.current?.focus();
    touched.current = null;
  }, [canGoBack, canGoForward]);

  function move(step: -1 | 1) {
    touched.current = step;
    onMove(step);
  }

  return (
    <div className={styles.arrows}>
      <IconButton
        ref={previous}
        icon="chevL"
        label="Mes anterior"
        disabled={!canGoBack}
        onClick={() => move(-1)}
      />
      <IconButton
        ref={next}
        icon="chev"
        label="Mes siguiente"
        disabled={!canGoForward}
        onClick={() => move(1)}
      />
    </div>
  );
}
