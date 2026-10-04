import type { ComponentProps } from 'react';

import { cx } from '@/shared/lib/cx';

import styles from './List.module.css';

interface ListProps extends ComponentProps<'div'> {
  /** `2` pasa a dos columnas desde 960 px, como las listas del prototipo. */
  columns?: 1 | 2;
  /** Separación en px. Por defecto 10; el prototipo usa 8 en las listas de editores. */
  gap?: number;
}

/** Grilla vertical de filas (<ListItem>, <Card>) con 10 px entre ellas. */
export function List({
  columns = 1,
  gap,
  className,
  style,
  ...rest
}: ListProps) {
  return (
    <div
      className={cx(styles.list, columns === 2 && styles.two, className)}
      style={gap === undefined ? style : { gap, ...style }}
      {...rest}
    />
  );
}
