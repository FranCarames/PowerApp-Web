import { useEffect } from 'react';
import { useRouteError } from 'react-router';

import { AuthCard } from '@/features/auth/components/AuthCard';
import { ErrorState } from '@/shared/ui';

/** Pantalla de error inesperado de cualquier ruta: en lugar de la de React Router, una en español con reintento. */
export function RouteError() {
  const error = useRouteError();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <AuthCard>
      <ErrorState
        title="Algo salió mal"
        message="Ocurrió un error inesperado. Probá recargar la pantalla."
        onRetry={() => window.location.reload()}
      />
    </AuthCard>
  );
}
