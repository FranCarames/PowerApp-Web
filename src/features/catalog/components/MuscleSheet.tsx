import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router';

import { getErrorMessage } from '@/api/errors';
import type { MuscleWithGroup } from '@/api/pending';
import {
  EmptyState,
  ErrorState,
  List,
  ListSkeleton,
  SectionHeader,
  Thumb,
} from '@/shared/ui';

import {
  useExerciseCatalog,
  type CatalogExercise,
} from '../hooks/useExerciseCatalog';
import { exercisesOfMuscle, OTHER_EXERCISES_LIMIT } from '../muscleExercises';
import { IN_HISTORY } from '../wikiState';
import styles from './MuscleSheet.module.css';
import { WikiRow } from './WikiRow';

interface MuscleSheetProps {
  muscle: MuscleWithGroup;
  /** De dónde cuelga la biblioteca: `/u/wiki` (Usuario) o `/c/ejercicios` (Entrenador). */
  basePath: string;
}

/**
 * La página de un músculo (CU-U-15 y CU-E-30): su ilustración, su grupo muscular con el mapa del
 * cuerpo, su descripción, los ejercicios que lo trabajan y otros ejercicios del mismo grupo. Lo que el
 * músculo no trae no se muestra.
 */
export function MuscleSheet({ muscle, basePath }: MuscleSheetProps) {
  const navigate = useNavigate();
  const catalog = useExerciseCatalog();
  const group = muscle.muscle_group;
  // El mapa del grupo viene en `GET /muscles/mg/all`, que el catálogo ya trae.
  const groupImage = catalog.groups?.find(
    ({ id }) => id === group.id,
  )?.preview_image;

  const lists = useMemo(
    () =>
      catalog.exercises &&
      exercisesOfMuscle(catalog.exercises, muscle.id, group.id),
    [catalog.exercises, muscle.id, group.id],
  );

  function openExercise({ id }: CatalogExercise) {
    void navigate(`${basePath}/${id}`, { state: IN_HISTORY });
  }

  return (
    <article>
      <div className={styles.intro}>
        <div className={styles.hero}>
          <Thumb
            icon="user"
            src={muscle.image_url || muscle.preview_image}
            size={96}
            className={styles.illustration}
          />
          <Link
            to={{ pathname: `${basePath}/musculos`, hash: `#${group.id}` }}
            className={styles.group}
          >
            <Thumb icon="user" src={groupImage} size={44} />
            <span className={styles.groupText}>
              <span className={styles.groupLabel}>Grupo muscular</span>
              <span className={styles.groupName}>{group.name}</span>
            </span>
          </Link>
        </div>
        {muscle.description && (
          <>
            <SectionHeader title="Descripción" />
            <p className={styles.text}>{muscle.description}</p>
          </>
        )}
      </div>

      {lists ? (
        <>
          <SectionHeader
            title="Ejercicios que lo trabajan"
            aside={<span className={styles.count}>{lists.working.length}</span>}
          />
          {lists.working.length === 0 ? (
            <EmptyState
              icon="dumbbell"
              message="Todavía no hay ejercicios que trabajen este músculo."
            />
          ) : (
            <List columns={2}>
              {lists.working.map((exercise) => (
                <WikiRow
                  key={exercise.id}
                  exercise={exercise}
                  onOpen={openExercise}
                />
              ))}
            </List>
          )}

          {lists.others.length > 0 && (
            <>
              <SectionHeader
                title={`Otros ejercicios de ${group.name}`}
                aside={
                  lists.others.length > OTHER_EXERCISES_LIMIT ? (
                    <Link
                      to={{ pathname: basePath, search: `?grupo=${group.id}` }}
                      className={styles.seeAll}
                    >
                      Ver todos
                    </Link>
                  ) : (
                    <span className={styles.count}>{lists.others.length}</span>
                  )
                }
              />
              <List columns={2}>
                {lists.others
                  .slice(0, OTHER_EXERCISES_LIMIT)
                  .map((exercise) => (
                    <WikiRow
                      key={exercise.id}
                      exercise={exercise}
                      onOpen={openExercise}
                    />
                  ))}
              </List>
            </>
          )}
        </>
      ) : catalog.isError ? (
        <ErrorState
          message={getErrorMessage(catalog.error)}
          onRetry={catalog.refetch}
          retrying={catalog.isRefetching}
        />
      ) : (
        <ListSkeleton columns={2} rows={4} />
      )}
    </article>
  );
}
