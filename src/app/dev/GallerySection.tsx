import type { ReactNode } from 'react';

import styles from './GallerySection.module.css';

interface GallerySectionProps {
  /** Ancla de la sección (la usa el índice de arriba de la galería). */
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
}

export function GallerySection({
  id,
  title,
  description,
  children,
}: GallerySectionProps) {
  return (
    <section id={id} className={styles.section} aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className={styles.heading}>
        {title}
      </h2>
      {description && <p className={styles.description}>{description}</p>}
      <div className={styles.body}>{children}</div>
    </section>
  );
}
