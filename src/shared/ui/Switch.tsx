import type { ComponentProps } from 'react';

import { cx } from '@/shared/lib/cx';

import styles from './Switch.module.css';

interface SwitchProps extends Omit<
  ComponentProps<'button'>,
  'children' | 'aria-label' | 'onChange' | 'onClick' | 'role' | 'aria-checked'
> {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** El nombre que se anuncia, p. ej. "Ver series de Empuje": el interruptor no tiene texto propio. */
  label: string;
}

/**
 * Interruptor de encendido y apagado (`.sw` del prototipo): un botón con `role="switch"` y
 * `aria-checked`. Al ser un botón, Enter y Espacio lo prenden y lo apagan como el clic. El texto que
 * se ve a su lado va aparte (y `aria-hidden`, si repite el nombre).
 */
export function Switch({
  checked,
  onChange,
  label,
  className,
  type = 'button',
  ...rest
}: SwitchProps) {
  return (
    <button
      type={type}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={cx(styles.switch, className)}
      onClick={() => onChange(!checked)}
      {...rest}
    />
  );
}
