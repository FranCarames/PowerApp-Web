import type { ComponentProps } from 'react';

import { cx } from '@/shared/lib/cx';

import styles from './Columns.module.css';

interface ColumnsProps extends ComponentProps<'div'> {
  /** Separación en px. Por defecto 10. */
  gap?: number;
}

/** Dos columnas iguales en cualquier ancho (.two del prototipo): pares de campos, de botones o de tarjetas. */
export function Columns({ gap, className, style, ...rest }: ColumnsProps) {
  return (
    <div
      className={cx(styles.columns, className)}
      style={gap === undefined ? style : { gap, ...style }}
      {...rest}
    />
  );
}
