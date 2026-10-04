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
  /** `alert` hace que se anuncie al aparecer: lo usa <ErrorState>. */
  role?: 'alert' | 'status';
  className?: string;
}

/** Estado vacío. Para un error de carga con reintento está <ErrorState>. */
export function EmptyState({
  message,
  title,
  icon,
  action,
  role,
  className,
}: EmptyStateProps) {
  return (
    <div role={role} className={cx(styles.empty, className)}>
      {icon && <Icon name={icon} size={28} className={styles.icon} />}
      {title && <div className={styles.title}>{title}</div>}
      <div>{message}</div>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
