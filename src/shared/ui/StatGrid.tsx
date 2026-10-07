import type { ComponentProps } from 'react';

import { cx } from '@/shared/lib/cx';

import styles from './StatGrid.module.css';

interface StatGridProps extends ComponentProps<'div'> {
  /** Cuántas columnas: tres, como el prototipo, o cuatro para los cuatro estados de una membresía. */
  columns?: 3 | 4;
}

/** Grilla de tres columnas (o cuatro) para <Stat>. */
export function StatGrid({ columns = 3, className, ...rest }: StatGridProps) {
  return (
    <div
      className={cx(styles.stats, columns === 4 && styles.four, className)}
      {...rest}
    />
  );
}
