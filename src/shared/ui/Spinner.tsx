import { cx } from '@/shared/lib/cx';

import styles from './Spinner.module.css';

interface SpinnerProps {
  /** Lado en px. */
  size?: number;
  /** Texto para lectores de pantalla. Con `null` el spinner es decorativo (p. ej. dentro de un botón). */
  label?: string | null;
  /** `current` toma el color del texto que lo rodea. */
  tone?: 'pri' | 'current';
  className?: string;
}

export function Spinner({
  size = 20,
  label = 'Cargando…',
  tone = 'pri',
  className,
}: SpinnerProps) {
  return (
    <span
      className={cx(
        styles.spinner,
        tone === 'current' && styles.current,
        className,
      )}
      style={{ width: size, height: size }}
      role={label ? 'status' : undefined}
      aria-hidden={label ? undefined : true}
    >
      {label && <span className={styles.srOnly}>{label}</span>}
    </span>
  );
}
