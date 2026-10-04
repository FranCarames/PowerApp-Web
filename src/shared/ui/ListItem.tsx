import type { ReactNode } from 'react';

import { Icon } from '@/shared/icons';

import { Card } from './Card';
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
