import type { ComponentProps } from 'react';

import { cx } from '@/shared/lib/cx';

import styles from './VisuallyHidden.module.css';

/** Texto que solo leen los lectores de pantalla. */
export function VisuallyHidden({ className, ...rest }: ComponentProps<'span'>) {
  return <span className={cx(styles.hidden, className)} {...rest} />;
}
