import { useState } from 'react';

import { Icon, type IconName } from '@/shared/icons';
import { cx } from '@/shared/lib/cx';

import styles from './Thumb.module.css';

interface ThumbProps {
  /** Ícono de reemplazo cuando no hay foto o no carga. */
  icon?: IconName;
  /** URL de la imagen (los ejercicios traen `preview_image`). */
  src?: string | null;
  /** Lado en px. */
  size?: number;
  className?: string;
}

/** Miniatura cuadrada de un ejercicio: su foto o, en su defecto, un ícono sobre el degradé. Es decorativa. */
export function Thumb({
  icon = 'dumbbell',
  src,
  size = 48,
  className,
}: ThumbProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = Boolean(src) && src !== failedSrc;

  return (
    <span
      aria-hidden="true"
      className={cx(styles.thumb, className)}
      style={{ width: size, height: size }}
    >
      {showImage && src ? (
        <img
          src={src}
          alt=""
          className={styles.image}
          onError={() => setFailedSrc(src)}
        />
      ) : (
        <Icon name={icon} size={size <= 40 ? 18 : 20} />
      )}
    </span>
  );
}
