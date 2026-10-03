import type { ReactNode } from 'react';

import { Icon, type IconName } from '@/shared/icons';
import { cx } from '@/shared/lib/cx';

import styles from './EmptyState.module.css';

interface EmptyStateProps {
  message: ReactNode;
  title?: string;
  icon?: IconName;
  /** Acción sugerida, p. ej. un <Button> para crear el primer registro o reintentar. */
  action?: ReactNode;
  className?: string;
}

/** Estado vacío (y, con una acción de reintento, también sirve para los errores de carga). */
export function EmptyState({
  message,
  title,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cx(styles.empty, className)}>
      {icon && <Icon name={icon} size={28} className={styles.icon} />}
      {title && <div className={styles.title}>{title}</div>}
      <div>{message}</div>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
