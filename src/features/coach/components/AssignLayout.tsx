import { useId, type ReactNode } from 'react';

import { PageHeader } from '@/shared/ui';

import styles from './AssignLayout.module.css';

/** Un paso de la pantalla, con su etiqueta como la de un campo. */
function Step({ label, children }: { label: string; children: ReactNode }) {
  const labelId = useId();
  return (
    <div role="group" aria-labelledby={labelId} className={styles.step}>
      <span id={labelId} className={styles.label}>
        {label}
      </span>
      {children}
    </div>
  );
}

interface AssignLayoutProps {
  eyebrow: string;
  title: string;
  /** El "Volver": la pantalla de donde se vino. */
  back: string;
  /** El `state` de la navegación de "Volver": lo que la pantalla de destino necesita para saber de dónde viene. */
  backState?: unknown;
  /** Avisos sobre lo que ya viene dado (una cuenta inactiva, un plan sin rutinas). */
  notice?: ReactNode;
  /** Lo que ya viene elegido de la pantalla de origen, con su etiqueta ("Planificación", "Rutina" o "Alumno"). */
  fixed: { label: string; content: ReactNode };
  /** Lo que se elige acá, con su etiqueta; sin él no hay nada que elegir (algo lo impide). */
  choice?: { label: string; content: ReactNode };
  /** El formulario, o el aviso de que falta elegir. */
  children?: ReactNode;
}

/**
 * La pantalla de asignar algo a un alumno, la misma para una planificación (CU-E-13) y para una rutina
 * puntual (CU-E-19), entre la planificación o la rutina y el alumno. Sirve si se entra desde la
 * planificación o la rutina (`/c/planes/:id/asignar`, `/c/rutinas/:id/asignar`, donde se elige al alumno)
 * o desde el alumno (`/c/alumnos/:id/asignar`, `/c/alumnos/:id/asignar-rutina`, donde se elige qué
 * asignarle): el encabezado, lo que ya viene dado, lo que se elige y, abajo, las fechas y el botón.
 */
export function AssignLayout({
  eyebrow,
  title,
  back,
  backState,
  notice,
  fixed,
  choice,
  children,
}: AssignLayoutProps) {
  return (
    <>
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        back={back}
        backState={backState}
      />
      <div className={styles.narrow}>
        {notice}
        <Step label={fixed.label}>{fixed.content}</Step>
        {choice && <Step label={choice.label}>{choice.content}</Step>}
        {children}
      </div>
    </>
  );
}
