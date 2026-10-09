import { useId, useState, type ReactNode } from 'react';

import type { ExerciseWithMuscles } from '@/api/pending';
import { Icon } from '@/shared/icons';
import { isHttpUrl } from '@/shared/lib/url';
import {
  ButtonLink,
  Note,
  Pill,
  SectionHeader,
  VisuallyHidden,
} from '@/shared/ui';

import styles from './ExerciseSheet.module.css';

interface PictureProps {
  src: string;
  className: string;
  /** Lo que se muestra si la imagen no carga. */
  fallback?: ReactNode;
}

/**
 * Una imagen del ejercicio. Es un link que carga el Admin y puede estar roto: si no carga, se
 * muestra el `fallback` o, sin él, queda lo que había debajo.
 */
function Picture({ src, className, fallback = null }: PictureProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  if (src === failedSrc) return fallback;
  return (
    <img
      src={src}
      alt=""
      className={className}
      onError={() => setFailedSrc(src)}
    />
  );
}

/** La cabecera de la ficha: la imagen de fondo, la miniatura y los músculos que trabaja. */
function Hero({ exercise }: { exercise: ExerciseWithMuscles }) {
  const { bg_image, preview_image, exercisedMuscles } = exercise;
  const labelId = useId();
  const dumbbell = <Icon name="dumbbell" size={36} />;

  return (
    <div className={styles.hero}>
      {isHttpUrl(bg_image) && (
        <>
          <Picture src={bg_image} className={styles.cover} />
          <span aria-hidden="true" className={styles.scrim} />
        </>
      )}
      <div className={styles.heroBody}>
        <span className={styles.icon} aria-hidden="true">
          {isHttpUrl(preview_image) ? (
            <Picture
              src={preview_image}
              className={styles.iconImage}
              fallback={dumbbell}
            />
          ) : (
            dumbbell
          )}
        </span>
        <div className={styles.muscles}>
          <div id={labelId} className={styles.label}>
            Músculos que trabaja
          </div>
          {exercisedMuscles.length === 0 ? (
            <div className={styles.none}>Sin músculos asignados</div>
          ) : (
            <ul className={styles.pills} aria-labelledby={labelId}>
              {exercisedMuscles.map((muscle) => (
                <li key={muscle.id}>
                  <Pill>{muscle.name}</Pill>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * La ficha de un ejercicio de la wiki (CU-U-15): los músculos que trabaja, la descripción, los tips
 * de seguridad y de activación, el video (un link que se abre aparte) y las imágenes. Lo que el
 * ejercicio no trae no se muestra.
 */
export function ExerciseSheet({ exercise }: { exercise: ExerciseWithMuscles }) {
  const { description, safety_tips, activation_tips, video_url } = exercise;

  return (
    <article className={styles.sheet}>
      <Hero exercise={exercise} />
      {description && (
        <>
          <SectionHeader title="Descripción" />
          <p className={styles.text}>{description}</p>
        </>
      )}
      {safety_tips && (
        <>
          <SectionHeader title="Tips de seguridad" />
          <Note tone="warn" icon="shield" className={styles.tip}>
            {safety_tips}
          </Note>
        </>
      )}
      {activation_tips && (
        <>
          <SectionHeader title="Tips de activación" />
          <Note tone="acc" icon="bolt" className={styles.tip}>
            {activation_tips}
          </Note>
        </>
      )}
      {isHttpUrl(video_url) && (
        <>
          <SectionHeader title="Video" />
          <ButtonLink variant="sec" icon="play" href={video_url} external>
            Ver video
            <VisuallyHidden> (se abre en otra pestaña)</VisuallyHidden>
          </ButtonLink>
        </>
      )}
    </article>
  );
}
