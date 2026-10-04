import type { ComponentProps } from 'react';

import { Icon, type IconName } from '@/shared/icons';
import { cx } from '@/shared/lib/cx';

import styles from './IconButton.module.css';

interface IconButtonProps extends Omit<
  ComponentProps<'button'>,
  'children' | 'aria-label'
> {
  icon: IconName;
  /** Qué hace el botón, p. ej. "Editar RM de Press de banca". Es obligatorio: no tiene texto. */
  label: string;
  /** `bordered`: cuadrado con borde, para la barra superior. `ghost`: sin borde, para las acciones de una fila. */
  variant?: 'bordered' | 'ghost';
  /** Solo `bordered`: `sm` es la versión de 34 px, la del selector de semana. */
  size?: 'md' | 'sm';
  /** Solo `ghost`: color de peligro, para borrar o quitar. */
  danger?: boolean;
  /** Solo `bordered`: contador sobre la esquina. Con 0 o sin valor no se muestra. */
  badge?: number;
}

/** Botón con solo un ícono. El `label` va como `aria-label` y como `title`. */
export function IconButton({
  icon,
  label,
  variant = 'bordered',
  size = 'md',
  danger = false,
  badge,
  className,
  type = 'button',
  ...rest
}: IconButtonProps) {
  const bordered = variant === 'bordered';

  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cx(
        bordered ? styles.bordered : styles.ghost,
        bordered && size === 'sm' && styles.sm,
        !bordered && danger && styles.danger,
        className,
      )}
      {...rest}
    >
      <Icon name={icon} size={bordered && size === 'md' ? 20 : 16} />
      {bordered && badge ? (
        <span className={styles.badge} aria-hidden="true">
          {badge}
        </span>
      ) : null}
    </button>
  );
}
