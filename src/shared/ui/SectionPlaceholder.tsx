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
  /** El `state` de la navegación de "Volver": lo que la pantalla de destino necesita para saber de dónde viene. */
  backState?: unknown;
  /** Qué falta, si no es esperar al backend de rutinas y planificaciones. */
  message?: string;
  /** Entre el encabezado y el aviso: por ejemplo, los segmentos de una pantalla que ya tiene uno que anda. */
  children?: ReactNode;
}

/**
 * Una sección o una acción que ya figura en la navegación pero todavía no se puede usar. Se reemplaza
 * por la pantalla de verdad cuando llega su tarea. Sin `message`, dice que se habilita cuando el
 * backend de rutinas y planificaciones esté completo (el bloque C2 del PLAN).
 */
export function SectionPlaceholder({
  title,
  eyebrow,
  icon,
  back,
  backState,
  message = 'Esta sección se habilita cuando el backend de rutinas y planificaciones esté completo.',
  children,
}: SectionPlaceholderProps) {
  return (
    <>
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        back={back}
        backState={backState}
      />
      {children}
      <EmptyState
        icon={icon}
        title="Sección en construcción"
        message={message}
      />
    </>
  );
}
