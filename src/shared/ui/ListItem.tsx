import type { ReactNode, Ref } from 'react';
import { Link, type To } from 'react-router';

import { Icon } from '@/shared/icons';
import { cx } from '@/shared/lib/cx';

import { Card } from './Card';
import cardStyles from './Card.module.css';
import styles from './ListItem.module.css';
import { SelectMark } from './SelectMark';
import type { Tone } from './tone';

interface ListItemProps {
  /** Lo que va al comienzo: un <Tile>, un <Thumb> o un <Avatar>. */
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Línea de acento bajo el subtítulo, p. ej. "6 ejercicios · 1 circuito". */
  meta?: ReactNode;
  /** Lo que va al final: un <Pill>, un valor, botones de ícono. Con `onClick` no pongas botones acá: la fila ya es un botón. */
  trailing?: ReactNode;
  /** Flecha final: indica que la fila abre otra pantalla. */
  chevron?: boolean;
  tone?: Tone;
  /** Con `onClick` la fila es un botón; sin él, un contenedor. */
  onClick?: () => void;
  /** Con `to` la fila es un link a otra pantalla (en lugar de `onClick`), como `a.card` del prototipo. */
  to?: To;
  /** El link de la fila (con `to`), p. ej. para devolverle el foco al volver de la pantalla a la que lleva. */
  linkRef?: Ref<HTMLAnchorElement>;
  /** Lista de selección (requiere `onClick`): marca al final, borde de marca y aria-pressed. */
  selected?: boolean;
  className?: string;
}

/** Fila de una lista: comienzo, título con subtítulo, y final. Es la composición más repetida del prototipo. */
export function ListItem({
  leading,
  title,
  subtitle,
  meta,
  trailing,
  chevron = false,
  tone,
  onClick,
  to,
  linkRef,
  selected,
  className,
}: ListItemProps) {
  const content = (
    <>
      {leading}
      <span className={styles.grow}>
        <span className={styles.title}>{title}</span>
        {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
        {meta && <span className={styles.meta}>{meta}</span>}
      </span>
      {trailing}
      {chevron && <Icon name="chev" size={18} className={styles.chevron} />}
      {selected !== undefined && <SelectMark checked={selected} />}
    </>
  );

  if (to !== undefined) {
    return (
      <Link
        to={to}
        ref={linkRef}
        className={cx(
          cardStyles.card,
          cardStyles.click,
          cardStyles.row,
          tone && cardStyles[tone],
          styles.link,
          className,
        )}
      >
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <Card
        row
        tone={tone}
        selected={selected}
        onClick={onClick}
        className={className}
      >
        {content}
      </Card>
    );
  }

  return (
    <Card row tone={tone} className={className}>
      {content}
    </Card>
  );
}
