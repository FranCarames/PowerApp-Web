import type { ReactNode } from 'react';

import { cx } from '@/shared/lib/cx';

import styles from './Stat.module.css';
import type { Tone } from './tone';

interface StatProps {
  value: ReactNode;
  label: string;
  /** Color del valor. */
  tone?: Tone;
  /** Fondo y borde con el tinte de `tone`. */
  tinted?: boolean;
  className?: string;
}

export function Stat({
  value,
  label,
  tone,
  tinted = false,
  className,
}: StatProps) {
  return (
    <div
      className={cx(
        styles.stat,
        tone && styles[tone],
        tinted && tone && styles.tinted,
        className,
      )}
    >
      <div className={styles.value}>{value}</div>
      <div className={styles.label}>{label}</div>
    </div>
  );
}
