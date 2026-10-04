import type { ComponentProps } from 'react';

import { cx } from '@/shared/lib/cx';

import styles from './ChipGroup.module.css';

interface ChipGroupProps extends ComponentProps<'div'> {
  /** Que los chips pasen a la línea siguiente en lugar de desplazarse en horizontal. */
  wrap?: boolean;
  center?: boolean;
}

export function ChipGroup({
  wrap = false,
  center = false,
  className,
  ...rest
}: ChipGroupProps) {
  return (
    <div
      role="group"
      className={cx(
        styles.chips,
        wrap && styles.wrap,
        center && styles.center,
        className,
      )}
      {...rest}
    />
  );
}
