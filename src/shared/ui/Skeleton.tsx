import { cx } from '@/shared/lib/cx';

import styles from './Skeleton.module.css';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  radius?: number | string;
  /** Círculo de lado `height` (avatares). */
  circle?: boolean;
  className?: string;
}

/** Bloque de carga. Es decorativo: quien lo usa marca el contenedor con aria-busy. */
export function Skeleton({
  width = '100%',
  height = 16,
  radius = 8,
  circle = false,
  className,
}: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={cx(styles.skeleton, className)}
      style={{
        width: circle ? height : width,
        height,
        borderRadius: circle ? '50%' : radius,
      }}
    />
  );
}
