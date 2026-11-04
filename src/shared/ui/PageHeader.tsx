import type { MouseEvent, ReactNode, Ref } from 'react';
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
  /** El `state` de la navegación de "Volver": lo que la pantalla de destino necesita para saber de dónde viene. */
  backState?: unknown;
  /** El texto del enlace de volver. Por defecto, "Volver". */
  backLabel?: string;
  /**
   * Al tocar el enlace de volver, antes de navegar. Con `event.preventDefault()` la pantalla navega por
   * su cuenta (p. ej. `navigate(-1)`), y el enlace sigue teniendo su destino para abrirlo en otra pestaña.
   */
  onBack?: (event: MouseEvent<HTMLAnchorElement>) => void;
  /** El título, para darle el foco al cambiar de vista. Con él, el título lleva `tabIndex={-1}`. */
  titleRef?: Ref<HTMLHeadingElement>;
  /** Título de la pestaña del navegador. Por defecto es `title`; con `false` no se toca. */
  documentTitle?: string | false;
}

/** Cabecera de una pantalla: "Volver", sobretítulo, título y acciones (.top del prototipo). */
export function PageHeader({
  title,
  eyebrow,
  actions,
  back,
  backState,
  backLabel = 'Volver',
  onBack,
  titleRef,
  documentTitle,
}: PageHeaderProps) {
  return (
    <header>
      {documentTitle !== false && (
        <title>{`${documentTitle ?? title} · PowerApp`}</title>
      )}
      {back && (
        <Link
          to={back}
          state={backState}
          className={styles.back}
          onClick={onBack}
        >
          <Icon name="chevL" size={18} />
          {backLabel}
        </Link>
      )}
      <div className={styles.top}>
        <div className={styles.heading}>
          {eyebrow && <div className={styles.eyebrow}>{eyebrow}</div>}
          <h1
            ref={titleRef}
            tabIndex={titleRef ? -1 : undefined}
            className={styles.title}
          >
            {title}
          </h1>
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    </header>
  );
}
