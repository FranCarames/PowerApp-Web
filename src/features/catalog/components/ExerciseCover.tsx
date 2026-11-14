import { useState } from 'react';

import { cx } from '@/shared/lib/cx';

import styles from './ExerciseCover.module.css';

interface ExerciseCoverProps {
  /** La foto de fondo del ejercicio (`bg_image`): un link http que ya pasó por `isHttpUrl`. */
  src: string;
}

type Status = { src: string; state: 'loaded' | 'failed' };

/**
 * La foto de fondo de la cabecera de la ficha, con el duotono de la marca: la foto en escala de grises, una
 * capa de color naranja → oscuro que la tiñe y un velo inferior para que se lea lo que va encima. El
 * tratamiento es de CSS y vale para cualquier foto, la del banco de imágenes o la que el Admin cargó a mano.
 *
 * Es un link que carga el Admin y puede estar roto: si no carga, no se muestra nada (la cabecera queda como
 * sin foto) y mientras carga se mantiene oculta, para que no se vea la capa de color sin la foto debajo.
 * Es decorativa: se pone dentro del contenedor de la cabecera, que es `position: relative`.
 */
export function ExerciseCover({ src }: ExerciseCoverProps) {
  const [status, setStatus] = useState<Status | null>(null);
  const state = status?.src === src ? status.state : 'loading';
  if (state === 'failed') return null;

  return (
    <span
      aria-hidden="true"
      className={cx(styles.cover, state === 'loaded' && styles.loaded)}
    >
      <img
        src={src}
        alt=""
        className={styles.photo}
        onLoad={() => setStatus({ src, state: 'loaded' })}
        onError={() => setStatus({ src, state: 'failed' })}
      />
      <span className={styles.tint} />
      <span className={styles.scrim} />
    </span>
  );
}
