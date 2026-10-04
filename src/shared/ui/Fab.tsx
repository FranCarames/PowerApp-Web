import type { ComponentProps } from 'react';

import { Icon, type IconName } from '@/shared/icons';
import { cx } from '@/shared/lib/cx';

import styles from './Fab.module.css';

interface FabProps extends Omit<
  ComponentProps<'button'>,
  'children' | 'aria-label'
> {
  /** Qué hace el botón, p. ej. "Crear rutina". Es obligatorio: el botón no tiene texto. */
  label: string;
  icon?: IconName;
}

/** Botón de acción flotante, fijo en la esquina inferior derecha. */
export function Fab({
  label,
  icon = 'plus',
  className,
  type = 'button',
  ...rest
}: FabProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cx(styles.fab, className)}
      {...rest}
    >
      <Icon name={icon} size={26} />
    </button>
  );
}
