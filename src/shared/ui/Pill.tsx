import type { ComponentProps } from 'react';

import { cx } from '@/shared/lib/cx';

import styles from './Pill.module.css';
import type { Tone } from './tone';

interface PillProps extends ComponentProps<'span'> {
  /** `mut` es el gris neutro. */
  tone?: Tone | 'mut';
}

export function Pill({ tone = 'mut', className, ...rest }: PillProps) {
  return (
    <span className={cx(styles.pill, styles[tone], className)} {...rest} />
  );
}
