import { useState } from 'react';

import type { User } from '@/api/types';
import { UserList } from '@/features/account/components/UserList';
import type { UsersFilter } from '@/features/account/hooks/useUsers';
import { useMembershipStatusByStudent } from '@/features/account/hooks/useStudentsByMembershipStatus';
import {
  KEYWORD_MAX_LENGTH,
  useSearchAndFilter,
} from '@/shared/lib/useSearchAndFilter';
import {
  Chip,
  ChipGroup,
  EmptyState,
  PageHeader,
  SearchInput,
} from '@/shared/ui';

import { UserCounters } from '../components/UserCounters';
import { UserDetailModal } from '../components/UserDetailModal';
import { UserRow } from '../components/UserRow';
import styles from './UsersPage.module.css';

/** Los chips, con el valor que llevan en la URL y lo que se le pide al backend. */
const FILTERS = [
  { label: 'Todos', param: null, filter: {} },
  { label: 'Alumnos', param: 'alumnos', filter: { role: 'user' } },
  { label: 'Entrenadores', param: 'entrenadores', filter: { role: 'coach' } },
  { label: 'Inactivos', param: 'inactivos', filter: { active: false } },
] as const satisfies ReadonlyArray<{
  label: string;
  param: string | null;
  filter: UsersFilter;
}>;

/** Qué decir cuando no hay usuarios, según lo que se estaba buscando. */
function EmptyUsers({
  keyword,
  hasFilter,
}: {
  keyword: string;
  hasFilter: boolean;
}) {
  if (keyword) {
    return (
      <EmptyState
        icon="search"
        title="Sin coincidencias"
        message="No hay usuarios que coincidan con la búsqueda."
      />
    );
  }
  return (
    <EmptyState
      icon="users"
      title={hasFilter ? undefined : 'Todavía no hay usuarios'}
      message={
        hasFilter
          ? 'No hay usuarios con ese filtro.'
          : 'Cuando alguien se registre, lo vas a ver acá.'
      }
    />
  );
}

/**
 * Usuarios del Admin (los casos de uso CU-E-01 a CU-E-03 vistos desde el Admin): contadores, búsqueda
 * por nombre o email, filtro por rol o por cuentas inactivas, y el listado paginado. Tocar un usuario
 * abre su detalle. La búsqueda y el chip quedan en la URL (`?q=…&filtro=alumnos`).
 */
export function UsersPage() {
  const { search, setSearch, keyword, filter, setFilter } = useSearchAndFilter(
    'filtro',
    ['alumnos', 'entrenadores', 'inactivos'],
  );
  const selected = FILTERS.find(({ param }) => param === filter) ?? FILTERS[0];
  const [openUser, setOpenUser] = useState<User | null>(null);
  // El estado de membresía de cada alumno, para la fila: son cuatro requests y no uno por alumno.
  const membershipByStudent = useMembershipStatusByStudent();

  return (
    <>
      <PageHeader eyebrow="Gestión" title="Usuarios" />
      <div className={styles.counters}>
        <UserCounters />
      </div>
      <SearchInput
        placeholder="Buscar por nombre o email"
        value={search}
        maxLength={KEYWORD_MAX_LENGTH}
        autoComplete="off"
        onChange={(event) => setSearch(event.target.value)}
      />
      <ChipGroup aria-label="Filtrar usuarios">
        {FILTERS.map(({ label, param }) => (
          <Chip
            key={label}
            selected={param === selected.param}
            onClick={() => setFilter(param)}
          >
            {label}
          </Chip>
        ))}
      </ChipGroup>
      <UserList
        filter={{ ...selected.filter, keyword }}
        empty={
          <EmptyUsers keyword={keyword} hasFilter={selected.param !== null} />
        }
        renderRow={(user) => (
          <UserRow
            key={user.id}
            user={user}
            membership={
              user.role === 'user'
                ? membershipByStudent.get(user.id)
                : undefined
            }
            onSelect={setOpenUser}
          />
        )}
      />
      <UserDetailModal user={openUser} onClose={() => setOpenUser(null)} />
    </>
  );
}
