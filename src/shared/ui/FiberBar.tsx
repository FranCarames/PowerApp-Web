import { cx } from '@/shared/lib/cx';

import styles from './FiberBar.module.css';

interface FiberBarProps {
  value: number;
  max?: number;
  /** Nombre accesible de lo que mide la barra, p. ej. "Adherencia". */
  label: string;
  /** Color de advertencia en lugar del degradé de marca. */
  warn?: boolean;
  /** Versión de 4 px de alto. */
  thin?: boolean;
  className?: string;
}

/** Barra de progreso con el relleno "fibra", el elemento firma de la app. */
export function FiberBar({
  value,
  max = 100,
  label,
  warn = false,
  thin = false,
  className,
}: FiberBarProps) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={cx(
        styles.fiber,
        warn && styles.warn,
        thin && styles.thin,
        className,
      )}
    >
      <span style={{ width: `${percent}%` }} />
    </div>
  );
}
