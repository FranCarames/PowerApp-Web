import { useState } from 'react';

import { cx } from '@/shared/lib/cx';

import styles from './Avatar.module.css';

interface AvatarProps {
  /** De acá sale la inicial que se muestra cuando no hay foto. */
  name: string;
  /** URL de la foto de perfil. Si falla la carga, se muestra la inicial. */
  src?: string | null;
  /** Lado en px. */
  size?: number;
  tone?: 'pri' | 'acc' | 'gray';
  /** Texto accesible. Sin él, el avatar es decorativo (el nombre suele estar al lado). */
  label?: string;
  className?: string;
}

export function Avatar({
  name,
  src,
  size = 40,
  tone = 'pri',
  label,
  className,
}: AvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = Boolean(src) && src !== failedSrc;
  const initial = name.trim().charAt(0).toUpperCase();

  return (
    <span
      className={cx(styles.avatar, tone !== 'pri' && styles[tone], className)}
      // En el prototipo la inicial mide 14 px hasta 40 px de lado y ~0,4 × el lado desde ahí.
      style={{
        width: size,
        height: size,
        fontSize: size <= 40 ? 14 : Math.round(size * 0.4),
      }}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {showImage && src ? (
        <img
          src={src}
          alt=""
          className={styles.image}
          onError={() => setFailedSrc(src)}
        />
      ) : (
        initial
      )}
    </span>
  );
}
