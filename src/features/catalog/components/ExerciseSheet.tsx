import { useId, useState, type ReactNode } from 'react';
import { Link } from 'react-router';

import type {
  CircuitExerciseRef,
  ExerciseMuscle,
  ExerciseWithMuscles,
} from '@/api/pending';
import { Icon } from '@/shared/icons';
import { isHttpUrl } from '@/shared/lib/url';
import {
  ButtonLink,
  Note,
  Pill,
  SectionHeader,
  VisuallyHidden,
} from '@/shared/ui';

import { IN_HISTORY } from '../wikiState';
import { ExerciseCover } from './ExerciseCover';
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

/**
 * Lo que la ficha necesita de un ejercicio: la descripción, los tips, el video y las imágenes. Lo cumplen
 * el ejercicio del catálogo y el que viene dentro de una rutina (`CircuitExerciseRef`).
 */
export type ExerciseSheetData = Pick<
  CircuitExerciseRef,
  | 'description'
  | 'safety_tips'
  | 'activation_tips'
  | 'video_url'
  | 'preview_image'
  | 'bg_image'
>;

interface HeroProps {
  exercise: ExerciseSheetData;
  /** Los músculos que trabaja. Sin ellos (`undefined`, todavía no llegaron) no se muestra el bloque. */
  muscles: readonly ExerciseMuscle[] | undefined;
  /**
   * De dónde cuelgan las páginas de músculo: `/u/wiki/musculos` o `/c/ejercicios/musculos`. Con ella,
   * cada músculo es un link a su página; sin ella, es solo una etiqueta.
   */
  musclesPath?: string;
}

/** La cabecera de la ficha: la imagen de fondo, la miniatura y los músculos que trabaja. */
export function ExerciseHero({ exercise, muscles, musclesPath }: HeroProps) {
  const { bg_image, preview_image } = exercise;
  const labelId = useId();
  const dumbbell = <Icon name="dumbbell" size={36} />;

  return (
    <div className={styles.hero}>
      {isHttpUrl(bg_image) && <ExerciseCover src={bg_image} />}
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
        {muscles && (
          <div className={styles.muscles}>
            <div id={labelId} className={styles.label}>
              Músculos que trabaja
            </div>
            {muscles.length === 0 ? (
              <div className={styles.none}>Sin músculos asignados</div>
            ) : (
              <ul className={styles.pills} aria-labelledby={labelId}>
                {muscles.map((muscle) => (
                  <li key={muscle.id}>
                    {musclesPath ? (
                      <Link
                        to={`${musclesPath}/${muscle.id}`}
                        state={IN_HISTORY}
                        className={styles.pillLink}
                      >
                        <Pill>{muscle.name}</Pill>
                      </Link>
                    ) : (
                      <Pill>{muscle.name}</Pill>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * El resto de la ficha: la descripción, los tips de seguridad y de activación y el video (un link que se
 * abre aparte). Lo que el ejercicio no trae no se muestra.
 */
export function ExerciseDetails({ exercise }: { exercise: ExerciseSheetData }) {
  const { description, safety_tips, activation_tips, video_url } = exercise;

  return (
    <>
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
    </>
  );
}

/**
 * La ficha de un ejercicio de la biblioteca (CU-U-15 y CU-E-30): los músculos que trabaja, la descripción, los tips
 * de seguridad y de activación, el video (un link que se abre aparte) y las imágenes. Lo que el
 * ejercicio no trae no se muestra.
 */
export function ExerciseSheet({
  exercise,
  musclesPath,
}: {
  exercise: ExerciseWithMuscles;
  musclesPath?: string;
}) {
  return (
    <article className={styles.sheet}>
      <ExerciseHero
        exercise={exercise}
        muscles={exercise.exercisedMuscles}
        musclesPath={musclesPath}
      />
      <ExerciseDetails exercise={exercise} />
    </article>
  );
}
