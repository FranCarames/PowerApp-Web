import type { ReactNode } from 'react';

import { cx } from '@/shared/lib/cx';

import styles from './SectionHeader.module.css';

interface SectionHeaderProps {
  title: string;
  /** Lo que va a la derecha: un contador, un enlace, el selector de semana. */
  aside?: ReactNode;
  /** Nivel del encabezado. El aspecto es el mismo en los tres. */
  level?: 2 | 3 | 4;
  className?: string;
}

/** Título de una sección de pantalla, con algo opcional a la derecha (.sec del prototipo). */
export function SectionHeader({
  title,
  aside,
  level = 2,
  className,
}: SectionHeaderProps) {
  const Heading = `h${level}` as const;

  return (
    <div className={cx(styles.sec, className)}>
      <Heading className={styles.title}>{title}</Heading>
      {aside && <div className={styles.aside}>{aside}</div>}
    </div>
  );
}
