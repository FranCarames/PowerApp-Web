import {
  Button,
  Card,
  EmptyState,
  Skeleton,
  Spinner,
  useToast,
} from '@/shared/ui';

import { GalleryDemo } from '../GalleryDemo';
import { GallerySection } from '../GallerySection';
import styles from './FeedbackSection.module.css';

export function FeedbackSection() {
  const toast = useToast();

  return (
    <GallerySection
      id="feedback"
      title="Estados de carga, vacío y mensajes"
      description="Toda pantalla con datos tiene estado de carga, vacío y error."
    >
      <GalleryDemo label="Spinner">
        <Spinner />
        <Spinner size={32} />
        <Spinner size={14} label="Guardando…" />
      </GalleryDemo>

      <GalleryDemo label="Skeleton" layout="stack">
        <Card row aria-busy="true">
          <Skeleton circle height={40} />
          <div className={styles.lines}>
            <Skeleton width="60%" height={14} />
            <Skeleton width="40%" height={12} />
          </div>
          <Skeleton width={56} height={20} radius={999} />
        </Card>
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
        <EmptyState
          icon="alert"
          title="No pudimos cargar los alumnos"
          message="Revisá tu conexión e intentá de nuevo."
          action={
            <Button sm variant="sec" icon="refresh">
              Reintentar
            </Button>
          }
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
