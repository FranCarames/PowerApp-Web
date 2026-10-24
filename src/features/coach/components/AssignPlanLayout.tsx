import { useId, type ReactNode } from 'react';

import { PageHeader } from '@/shared/ui';

import styles from './AssignPlanLayout.module.css';

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

interface AssignPlanLayoutProps {
  eyebrow: string;
  title: string;
  /** El "Volver": la pantalla de donde se vino. */
  back: string;
  /** Avisos sobre lo que ya viene dado (una cuenta inactiva, un plan sin rutinas). */
  notice?: ReactNode;
  /** Lo que ya viene elegido de la pantalla de origen, con su etiqueta ("Planificación" o "Alumno"). */
  fixed: { label: string; content: ReactNode };
  /** Lo que se elige acá, con su etiqueta; sin él no hay nada que elegir (algo lo impide). */
  choice?: { label: string; content: ReactNode };
  /** El formulario, o el aviso de que falta elegir. */
  children?: ReactNode;
}

/**
 * La pantalla de asignar una planificación a un alumno (CU-E-13), la misma sirve si se entra desde la
 * planificación (`/c/planes/:id/asignar`, donde se elige al alumno) o desde el alumno
 * (`/c/alumnos/:id/asignar`, donde se elige la planificación): el encabezado, lo que ya viene dado, lo que
 * se elige y, abajo, las fechas y el botón.
 */
export function AssignPlanLayout({
  eyebrow,
  title,
  back,
  notice,
  fixed,
  choice,
  children,
}: AssignPlanLayoutProps) {
  return (
    <>
      <PageHeader eyebrow={eyebrow} title={title} back={back} />
      <div className={styles.narrow}>
        {notice}
        <Step label={fixed.label}>{fixed.content}</Step>
        {choice && <Step label={choice.label}>{choice.content}</Step>}
        {children}
      </div>
    </>
  );
}
