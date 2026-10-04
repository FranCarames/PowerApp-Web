import { useState } from 'react';

import {
  Button,
  EmptyState,
  ErrorState,
  ListSkeleton,
  Skeleton,
  Spinner,
  useToast,
} from '@/shared/ui';

import { GalleryDemo } from '../GalleryDemo';
import { GallerySection } from '../GallerySection';

export function FeedbackSection() {
  const toast = useToast();
  const [retrying, setRetrying] = useState(false);

  function retry() {
    setRetrying(true);
    setTimeout(() => setRetrying(false), 1500);
  }

  return (
    <GallerySection
      id="feedback"
      title="Estados de carga, vacío, error y mensajes"
      description="Toda pantalla con datos tiene estado de carga, vacío y error."
    >
      <GalleryDemo label="Spinner">
        <Spinner />
        <Spinner size={32} />
        <Spinner size={14} label="Guardando…" />
      </GalleryDemo>

      <GalleryDemo
        label="Skeleton y ListSkeleton (carga de una lista)"
        layout="stack"
      >
        <ListSkeleton rows={2} />
        <Skeleton height={96} radius={16} />
      </GalleryDemo>

      <GalleryDemo label="EmptyState" layout="stack">
        <EmptyState message="Todavía no registraste ningún RM. Registrá el primero para seguir tu progreso." />
        <EmptyState
          icon="search"
          title="Sin resultados"
          message="No hay ejercicios con ese nombre. Probá con otra búsqueda."
          action={
            <Button sm variant="ghost">
              Limpiar búsqueda
            </Button>
          }
        />
      </GalleryDemo>

      <GalleryDemo
        label="ErrorState (reintentar simula 1,5 s de espera)"
        layout="stack"
      >
        <ErrorState onRetry={retry} retrying={retrying} />
        <ErrorState
          title="No pudimos cargar los alumnos"
          message="El servidor está tardando en responder."
        />
      </GalleryDemo>

      <GalleryDemo label="Toast (uno por vez; el nuevo reemplaza al anterior)">
        <Button sm onClick={() => toast.success('Cuenta creada')}>
          Éxito
        </Button>
        <Button
          sm
          variant="danger"
          onClick={() => toast.error('Ingresá un email válido')}
        >
          Error
        </Button>
        <Button
          sm
          variant="ghost"
          onClick={() => toast.success('Pago registrado · Lucía Méndez')}
        >
          Mensaje largo
        </Button>
      </GalleryDemo>
    </GallerySection>
  );
}
