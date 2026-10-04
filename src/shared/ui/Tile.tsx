import type { ReactNode } from 'react';

import { Icon, type IconName } from '@/shared/icons';
import { cx } from '@/shared/lib/cx';

import styles from './Tile.module.css';
import type { Tone } from './tone';

interface TileProps {
  /** Ícono. Sin él, se muestra `children` (una letra, como la A, B o C de las rutinas). */
  icon?: IconName;
  children?: ReactNode;
  /** `mut` es el gris neutro. */
  tone?: Tone | 'mut';
  /** Lado en px. Desde 56 px el radio y el ícono son los grandes del prototipo. */
  size?: number;
  className?: string;
}

/** Cuadrado con un ícono o una letra, para el comienzo de una fila. Es decorativo. */
export function Tile({
  icon,
  children,
  tone = 'mut',
  size = 40,
  className,
}: TileProps) {
  const large = size >= 56;

  return (
    <span
      aria-hidden="true"
      className={cx(
        styles.tile,
        styles[tone],
        !icon && styles.letter,
        className,
      )}
      style={{ width: size, height: size, borderRadius: large ? 18 : 11 }}
    >
      {icon ? <Icon name={icon} size={large ? 28 : 18} /> : children}
    </span>
  );
}
