import type { ComponentProps } from 'react';

import { Icon, type IconName } from '@/shared/icons';
import { cx } from '@/shared/lib/cx';

import styles from './Button.module.css';
import { Spinner } from './Spinner';

type ButtonVariant = 'pri' | 'sec' | 'ghost' | 'danger';

interface ButtonProps extends ComponentProps<'button'> {
  variant?: ButtonVariant;
  /** Versión compacta, de ancho automático. */
  sm?: boolean;
  /** Solo con `variant="danger"`: relleno rojo en lugar del contorno. */
  solid?: boolean;
  /** Borde punteado, para acciones del tipo "Agregar…". */
  dashed?: boolean;
  /** Ícono a la izquierda del texto. */
  icon?: IconName;
  /** Muestra un spinner, deshabilita el botón y lo marca como ocupado. */
  loading?: boolean;
}

// type="button" por defecto: los botones que envían un formulario piden type="submit".
export function Button({
  variant = 'pri',
  sm = false,
  solid = false,
  dashed = false,
  icon,
  loading = false,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        styles.btn,
        styles[variant],
        sm && styles.sm,
        solid && styles.solid,
        dashed && styles.dashed,
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <Spinner size={16} label={null} tone="current" />
      ) : (
        icon && <Icon name={icon} size={16} />
      )}
      {children}
    </button>
  );
}
