import type { ReactNode } from 'react';

import { Button } from './Button';
import { EmptyState } from './EmptyState';

interface ErrorStateProps {
  title?: string;
  message?: ReactNode;
  /** Con esta función se muestra el botón "Reintentar". */
  onRetry?: () => void;
  /** Mientras es true, el botón queda ocupado. */
  retrying?: boolean;
  className?: string;
}

/** Estado de error de una pantalla con datos: mensaje estándar y reintento. Se anuncia al aparecer. */
export function ErrorState({
  title = 'No pudimos cargar los datos',
  message = 'Revisá tu conexión e intentá de nuevo.',
  onRetry,
  retrying = false,
  className,
}: ErrorStateProps) {
  return (
    <EmptyState
      role="alert"
      icon="alert"
      title={title}
      message={message}
      className={className}
      action={
        onRetry && (
          <Button
            sm
            variant="sec"
            icon="refresh"
            loading={retrying}
            onClick={onRetry}
          >
            Reintentar
          </Button>
        )
      }
    />
  );
}
