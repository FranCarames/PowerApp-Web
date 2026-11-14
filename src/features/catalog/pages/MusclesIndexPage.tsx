import { useEffect, useMemo, type ReactNode } from 'react';
import { useLocation, useNavigate, type To } from 'react-router';

import { getErrorMessage } from '@/api/errors';
import {
  EmptyState,
  ErrorState,
  List,
  ListItem,
  ListSkeleton,
  PageHeader,
  Thumb,
} from '@/shared/ui';

import { LibrarySegments } from '../components/LibrarySegments';
import { useMuscleGroups } from '../hooks/useMuscleGroups';
import { useMuscles } from '../hooks/useMuscles';
import { IN_HISTORY } from '../wikiState';
import styles from './MusclesIndexPage.module.css';

interface MusclesIndexPageProps {
  /** De dónde cuelga la biblioteca: `/u/wiki` (Usuario) o `/c/ejercicios` (Entrenador). */
  basePath: string;
  /** Destino de "Volver". Sin él, no se muestra. */
  back?: To;
  /** Lo que va entre el encabezado y los segmentos: los del tab Rutinas del Entrenador. */
  nav?: ReactNode;
}

const byName = (a: { name: string }, b: { name: string }) =>
  a.name.localeCompare(b.name, 'es');

/**
 * El índice de músculos de la biblioteca (CU-U-15 y CU-E-30), en `<basePath>/musculos`: los grupos
 * musculares, cada uno con su mapa del cuerpo y sus músculos. Cada músculo abre su página en
 * `<basePath>/musculos/:id`. Cada grupo es un ancla (`#<id del grupo>`): es adonde lleva el grupo de
 * la página de un músculo.
 */
export function MusclesIndexPage({
  basePath,
  back,
  nav,
}: MusclesIndexPageProps) {
  const navigate = useNavigate();
  const { hash } = useLocation();
  const groupsQuery = useMuscleGroups();
  // Las miniaturas de los músculos solo vienen en `GET /muscles/all`. Si no llegan, va el ícono.
  const musclesQuery = useMuscles();

  const groups = useMemo(
    () =>
      groupsQuery.data &&
      [...groupsQuery.data].sort(byName).map((group) => ({
        ...group,
        muscles: [...group.muscles].sort(byName),
      })),
    [groupsQuery.data],
  );
  const previewOfMuscle = useMemo(
    () =>
      new Map(
        musclesQuery.data?.map(({ id, preview_image }) => [id, preview_image]),
      ),
    [musclesQuery.data],
  );

  // En una carga en frío los grupos llegan después de que el navegador buscó el ancla.
  useEffect(() => {
    if (!groups || !hash) return;
    document
      .getElementById(decodeURIComponent(hash.slice(1)))
      ?.scrollIntoView();
  }, [groups, hash]);

  return (
    <>
      <PageHeader eyebrow="Biblioteca" title="Músculos" back={back} />
      {nav}
      <LibrarySegments basePath={basePath} value="musculos" />
      {groups ? (
        groups.length === 0 ? (
          <EmptyState
            icon="grid"
            title="Todavía no hay grupos musculares"
            message="Cuando se carguen, los vas a encontrar acá."
          />
        ) : (
          groups.map((group) => (
            <section
              key={group.id}
              id={group.id}
              className={styles.group}
              aria-labelledby={`${group.id}-name`}
            >
              <div className={styles.head}>
                <Thumb icon="user" src={group.preview_image} size={56} />
                <h2 id={`${group.id}-name`} className={styles.name}>
                  {group.name}
                </h2>
                <span className={styles.count}>
                  {group.muscles.length}{' '}
                  {group.muscles.length === 1 ? 'músculo' : 'músculos'}
                </span>
              </div>
              {group.muscles.length === 0 ? (
                <EmptyState message="Este grupo todavía no tiene músculos." />
              ) : (
                <List columns={2}>
                  {group.muscles.map((muscle) => (
                    <ListItem
                      key={muscle.id}
                      leading={
                        <Thumb
                          icon="user"
                          src={previewOfMuscle.get(muscle.id)}
                        />
                      }
                      title={muscle.name}
                      chevron
                      onClick={() =>
                        void navigate(`${basePath}/musculos/${muscle.id}`, {
                          state: IN_HISTORY,
                        })
                      }
                    />
                  ))}
                </List>
              )}
            </section>
          ))
        )
      ) : groupsQuery.isError ? (
        <ErrorState
          message={getErrorMessage(groupsQuery.error)}
          onRetry={() => void groupsQuery.refetch()}
          retrying={groupsQuery.isRefetching}
        />
      ) : (
        <ListSkeleton columns={2} rows={6} />
      )}
    </>
  );
}
