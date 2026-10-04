import { useNavigate } from 'react-router';

import { Button, EmptyState, PageHeader } from '@/shared/ui';

/** Cualquier dirección que no existe. Se muestra dentro de <AuthLayout>. */
export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <>
      <PageHeader title="Página no encontrada" />
      <EmptyState
        icon="search"
        message="La dirección que abriste no existe o ya no está disponible."
        action={
          <Button sm variant="sec" onClick={() => navigate('/')}>
            Ir al inicio
          </Button>
        }
      />
    </>
  );
}
