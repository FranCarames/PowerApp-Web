import { Icon } from '@/shared/icons';
import { cx } from '@/shared/lib/cx';

import styles from './Logo.module.css';

interface LogoProps {
  /** `md` (56 px) es el de las pantallas de acceso; `sm` (40 px), el de la barra lateral. */
  size?: 'md' | 'sm';
  className?: string;
}

/** Marca de PowerApp: el rayo sobre el degradé, con el punto de acento. Es decorativa: el nombre va al lado. */
export function Logo({ size = 'md', className }: LogoProps) {
  return (
    <span
      aria-hidden="true"
      className={cx(styles.logo, size === 'sm' && styles.sm, className)}
    >
      <Icon name="bolt" size={size === 'sm' ? 18 : 26} />
    </span>
  );
}
