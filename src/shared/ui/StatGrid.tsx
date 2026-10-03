import type { ComponentProps } from 'react';

import { cx } from '@/shared/lib/cx';

import styles from './StatGrid.module.css';

/** Grilla de tres columnas para <Stat>. */
export function StatGrid({ className, ...rest }: ComponentProps<'div'>) {
  return <div className={cx(styles.stats, className)} {...rest} />;
}
