import type { SVGProps } from 'react';

import { cx } from '@/shared/lib/cx';

import { ICON_PATHS, type IconName } from './iconPaths';
import styles from './Icon.module.css';

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name' | 'children'> {
  name: IconName;
  /** Lado en px. Por defecto 20, como en el prototipo. */
  size?: number;
  /** Texto accesible. Sin él, el ícono es decorativo y se oculta a los lectores de pantalla. */
  label?: string;
}

export function Icon({
  name,
  size,
  label,
  className,
  style,
  ...rest
}: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cx(styles.icon, className)}
      style={size ? { width: size, height: size, ...style } : style}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      {...rest}
    >
      {ICON_PATHS[name]}
    </svg>
  );
}
