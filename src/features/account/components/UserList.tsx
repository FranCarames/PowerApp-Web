import type { ReactNode } from 'react';

import { getErrorMessage } from '@/api/errors';
import type { User } from '@/api/types';
import { cx } from '@/shared/lib/cx';
import { Button, ErrorState, List, ListSkeleton } from '@/shared/ui';

import { useUsers, type UsersFilter } from '../hooks/useUsers';
import styles from './UserList.module.css';

interface UserListProps {
  filter: UsersFilter;
  /** Qué mostrar cuando ningún usuario cumple el filtro. */
  empty: ReactNode;
  /** La fila de cada usuario. Cada pantalla arma la suya. */
  renderRow: (user: User) => ReactNode;
}

/**
 * Los usuarios de a páginas, con carga, error, vacío y "Cargar más". Una búsqueda nueva deja a la
 * vista el resultado anterior, apagado, hasta que llega el suyo. Lo usan Mis alumnos y los Usuarios
 * del Admin.
 */
export function UserList({ filter, empty, renderRow }: UserListProps) {
  const query = useUsers(filter);
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

  if (data.users.length === 0) return empty;

  return (
    <div
      aria-busy={query.isPlaceholderData || undefined}
      className={cx(query.isPlaceholderData && styles.stale)}
    >
      <List columns={2}>{data.users.map(renderRow)}</List>
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
            Mostrando {data.users.length} de {data.total}
          </p>
        </div>
      )}
    </div>
  );
}
