import type { ReactNode } from 'react';

import { Note, Pill, SectionHeader, VisuallyHidden } from '@/shared/ui';

import styles from './PlanWeeksSection.module.css';

interface PlanWeeksSectionProps {
  /** El contador de la píldora: «N de M rutinas». */
  summary: string;
  /** Verde solo si las rutinas del plan son las que prevé. */
  complete: boolean;
  /** Lo que explica la sección, bajo su título. */
  intro: string;
  /** Un aviso sobre las semanas (edición: la duración escrita todavía no se guardó). */
  notice?: string;
  /** Un error de lo último que se hizo en las semanas (edición: no se pudo guardar el orden). */
  alert?: string;
  /** Lo que se anuncia a los lectores de pantalla al mover una rutina con el teclado. */
  announcement: string;
  /** El `id` del texto oculto que explica el grabber: lo leen todas las tarjetas. */
  grabHintId: string;
  /** Las tarjetas de las semanas. */
  children: ReactNode;
  /** Lo que va debajo de las tarjetas: acciones de la sección. */
  footer?: ReactNode;
}

/**
 * «Semanas del plan» (CU-E-09 y CU-E-12): el título con su contador, lo que explica la sección y, debajo, las
 * tarjetas de las semanas en una grilla. Es el marco de las semanas del alta (el borrador) y de las del
 * editor (el plan guardado). También lleva el texto oculto que describe el grabber y la región que anuncia
 * la posición nueva de una rutina movida con el teclado.
 */
export function PlanWeeksSection({
  summary,
  complete,
  intro,
  notice,
  alert,
  announcement,
  grabHintId,
  children,
  footer,
}: PlanWeeksSectionProps) {
  return (
    <section aria-label="Semanas del plan" className={styles.section}>
      <SectionHeader
        level={3}
        title="Semanas del plan"
        aside={<Pill tone={complete ? 'ok' : 'acc'}>{summary}</Pill>}
      />
      <p className={styles.intro}>{intro}</p>
      {notice && (
        <Note tone="acc" icon="alert">
          {notice}
        </Note>
      )}
      {alert && (
        <Note tone="err" icon="alert" role="alert">
          {alert}
        </Note>
      )}
      <VisuallyHidden id={grabHintId}>
        Arrastrala para cambiarle el lugar dentro de la semana, o usá las
        flechas arriba y abajo.
      </VisuallyHidden>
      <VisuallyHidden role="status" aria-live="polite">
        {announcement}
      </VisuallyHidden>
      <div className={styles.grid}>{children}</div>
      {footer}
    </section>
  );
}
