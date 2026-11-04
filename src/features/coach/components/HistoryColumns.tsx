import { useEffect, useRef, useState, type ReactNode } from 'react';

import { cx } from '@/shared/lib/cx';

import styles from './HistoryColumns.module.css';

/** Lo que la columna izquierda deja libre arriba y abajo cuando queda fija (24 px de cada lado). */
const STICKY_MARGIN = 48;

/**
 * Las dos columnas del historial (spec 10, `.hcols` del prototipo). En el celular, una sola: primero
 * `left` y después `right`. Desde 960 px, la izquierda (de 320 a 380 px) queda fija al hacer scroll,
 * salvo que sea más alta que la ventana (con el buscador abierto): ahí se desplaza con la página.
 */
export function HistoryColumns({
  left,
  right,
}: {
  left: ReactNode;
  right: ReactNode;
}) {
  const leftRef = useRef<HTMLDivElement>(null);
  const [tall, setTall] = useState(false);

  useEffect(() => {
    const element = leftRef.current;
    if (!element) return;
    const measure = () =>
      setTall(element.offsetHeight > window.innerHeight - STICKY_MARGIN);
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  return (
    <div className={styles.columns}>
      <div ref={leftRef} className={cx(styles.left, !tall && styles.sticky)}>
        {left}
      </div>
      <div className={styles.right}>{right}</div>
    </div>
  );
}
