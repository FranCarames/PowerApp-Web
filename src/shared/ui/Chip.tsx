import type { ComponentProps } from 'react';

import { cx } from '@/shared/lib/cx';

import styles from './Chip.module.css';

interface ChipProps extends ComponentProps<'button'> {
  /**
   * Para filtros: marca el chip activo y publica aria-pressed. Sin él, es un botón común.
   * Una etiqueta que se ve activa pero no es un interruptor (p. ej. con ✕) pasa además
   * `aria-pressed={undefined}`.
   */
  selected?: boolean;
  /** Color del chip activo. */
  tone?: 'pri' | 'acc';
}

export function Chip({
  selected,
  tone = 'pri',
  className,
  type = 'button',
  ...rest
}: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={cx(
        styles.chip,
        selected && styles.on,
        tone === 'acc' && styles.acc,
        className,
      )}
      {...rest}
    />
  );
}
