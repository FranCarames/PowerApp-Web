import { EmptyState, PageHeader } from '@/shared/ui';

// TEMPORAL (T31 a T33): los catálogos de ejercicios, músculos y grupos reemplazan esta pantalla.
export function CatalogPage() {
  return (
    <>
      <PageHeader eyebrow="Catálogo" title="Ejercicios" />
      <EmptyState
        icon="grid"
        title="Pantalla en construcción"
        message="El catálogo se arma en las tareas T31 a T33."
      />
    </>
  );
}
