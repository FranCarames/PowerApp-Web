import type { ReactNode } from 'react';
import { Link, type To } from 'react-router';

import { Icon } from '@/shared/icons';

import styles from './PageHeader.module.css';

interface PageHeaderProps {
  /** Es el <h1> de la pantalla. */
  title: string;
  /** Línea chica sobre el título: la sección, el paso o un saludo. */
  eyebrow?: string;
  /** A la derecha del título: botones de ícono, un avatar. */
  actions?: ReactNode;
  /** Destino del enlace "Volver". Sin él, no se muestra. */
  back?: To;
  /** Título de la pestaña del navegador. Por defecto es `title`; con `false` no se toca. */
  documentTitle?: string | false;
}

/** Cabecera de una pantalla: "Volver", sobretítulo, título y acciones (.top del prototipo). */
export function PageHeader({
  title,
  eyebrow,
  actions,
  back,
  documentTitle,
}: PageHeaderProps) {
  return (
    <header>
      {documentTitle !== false && (
        <title>{`${documentTitle ?? title} · PowerApp`}</title>
      )}
      {back && (
        <Link to={back} className={styles.back}>
          <Icon name="chevL" size={18} />
          Volver
        </Link>
      )}
      <div className={styles.top}>
        <div className={styles.heading}>
          {eyebrow && <div className={styles.eyebrow}>{eyebrow}</div>}
          <h1 className={styles.title}>{title}</h1>
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    </header>
  );
}
