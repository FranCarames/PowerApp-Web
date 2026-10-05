import { getErrorMessage } from '@/api/errors';
import { cx } from '@/shared/lib/cx';
import {
  Button,
  EmptyState,
  ErrorState,
  List,
  ListSkeleton,
} from '@/shared/ui';

import { useStudents, type StudentsFilter } from '../hooks/useStudents';
import styles from './StudentList.module.css';
import { StudentRow } from './StudentRow';

/** Qué decir cuando no hay alumnos, según lo que se estaba buscando (CU-E-01 y CU-E-02). */
function EmptyStudents({ keyword, active }: StudentsFilter) {
  if (keyword) {
    return (
      <EmptyState
        icon="search"
        title="Sin coincidencias"
        message="No hay alumnos que coincidan con la búsqueda."
      />
    );
  }
  if (active !== undefined) {
    return (
      <EmptyState
        icon="users"
        message={`No hay alumnos ${active ? 'activos' : 'inactivos'}.`}
      />
    );
  }
  return (
    <EmptyState
      icon="users"
      title="Todavía no hay alumnos"
      message="Los alumnos se registran solos. Cuando alguien lo haga, lo vas a ver acá."
    />
  );
}

/**
 * Los alumnos de a páginas (CU-E-01) y su búsqueda (CU-E-02): carga, error, vacío y "Cargar más".
 * Una búsqueda nueva deja a la vista el resultado anterior, apagado, hasta que llega el suyo.
 */
export function StudentList({ keyword, active }: StudentsFilter) {
  const query = useStudents({ keyword, active });
  const { data } = query;

  if (!data) {
    return query.isError ? (
      <ErrorState
        message={getErrorMessage(query.error)}
        onRetry={() => void query.refetch()}
        retrying={query.isRefetching}
      />
    ) : (
      <ListSkeleton columns={2} rows={6} />
    );
  }

  if (data.students.length === 0) {
    return <EmptyStudents keyword={keyword} active={active} />;
  }

  return (
    <div
      aria-busy={query.isPlaceholderData || undefined}
      className={cx(query.isPlaceholderData && styles.stale)}
    >
      <List columns={2}>
        {data.students.map((student) => (
          <StudentRow key={student.id} student={student} />
        ))}
      </List>
      {query.hasNextPage && (
        <div className={styles.more}>
          {query.isFetchNextPageError && (
            <p role="alert" className={styles.error}>
              {getErrorMessage(query.error)}
            </p>
          )}
          <Button
            variant="sec"
            loading={query.isFetchingNextPage}
            onClick={() => void query.fetchNextPage()}
          >
            {query.isFetchNextPageError ? 'Reintentar' : 'Cargar más'}
          </Button>
          <p className={styles.caption}>
            Mostrando {data.students.length} de {data.total}
          </p>
        </div>
      )}
    </div>
  );
}
