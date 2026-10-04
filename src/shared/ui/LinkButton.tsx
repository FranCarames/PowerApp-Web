import type { ComponentProps } from 'react';

import { cx } from '@/shared/lib/cx';

import styles from './LinkButton.module.css';

interface LinkButtonProps extends ComponentProps<'button'> {
  tone?: 'acc' | 'danger';
}

/** Acción en forma de texto, como "¿Olvidaste tu contraseña?" o "Quitar circuito". */
export function LinkButton({
  tone = 'acc',
  className,
  type = 'button',
  ...rest
}: LinkButtonProps) {
  return (
    <button
      type={type}
      className={cx(styles.link, tone === 'danger' && styles.danger, className)}
      {...rest}
    />
  );
}
