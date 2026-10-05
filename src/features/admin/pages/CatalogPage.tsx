import { EmptyState, PageHeader } from '@/shared/ui';

// TEMPORAL (T32 y T33): los segmentos Músculos y Grupos musculares reemplazan esta pantalla.
export function CatalogPage() {
  return (
    <>
      <PageHeader eyebrow="Configuración" title="Catálogo" />
      <EmptyState
        icon="grid"
        title="Pantalla en construcción"
        message="El catálogo de músculos y grupos musculares se arma en las tareas T32 y T33."
      />
    </>
  );
}
