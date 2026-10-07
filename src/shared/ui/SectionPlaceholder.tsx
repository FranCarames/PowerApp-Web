import type { ReactNode } from 'react';
import type { To } from 'react-router';

import type { IconName } from '@/shared/icons';

import { EmptyState } from './EmptyState';
import { PageHeader } from './PageHeader';

interface SectionPlaceholderProps {
  /** El título de la sección: es el <h1>. */
  title: string;
  /** Línea chica sobre el título. */
  eyebrow?: string;
  /** El ícono de la sección. */
  icon: IconName;
  /** Destino del "Volver", en las pantallas de detalle. */
  back?: To;
  /** Entre el encabezado y el aviso: por ejemplo, los segmentos de una pantalla que ya tiene uno que anda. */
  children?: ReactNode;
}

/**
 * Una sección que ya figura en la navegación pero todavía no se puede usar: Rutinas y Planificaciones
 * esperan a que el backend de rutinas y planificaciones esté completo (bloque C2 del PLAN). Se
 * reemplaza por la pantalla de verdad cuando llega su tarea.
 */
export function SectionPlaceholder({
  title,
  eyebrow,
  icon,
  back,
  children,
}: SectionPlaceholderProps) {
  return (
    <>
      <PageHeader eyebrow={eyebrow} title={title} back={back} />
      {children}
      <EmptyState
        icon={icon}
        title="Sección en construcción"
        message="Esta sección se habilita cuando el backend de rutinas y planificaciones esté completo."
      />
    </>
  );
}
