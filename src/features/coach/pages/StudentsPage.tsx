import { AccountLink } from '@/features/account/components/AccountLink';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  KEYWORD_MAX_LENGTH,
  useSearchAndFilter,
} from '@/shared/lib/useSearchAndFilter';
import { Chip, ChipGroup, PageHeader, SearchInput } from '@/shared/ui';

import { MembershipsButton } from '../components/MembershipsButton';
import { StudentCounters } from '../components/StudentCounters';
import { StudentList } from '../components/StudentList';
import styles from './StudentsPage.module.css';

/** Los chips de estado, con el valor que llevan en la URL y el `active` que se le manda al backend. */
const STATUS_FILTERS = [
  { label: 'Todos', param: null, active: undefined },
  { label: 'Activos', param: 'activos', active: true },
  { label: 'Inactivos', param: 'inactivos', active: false },
] as const;

/**
 * Mis alumnos (CU-E-01 y CU-E-02): contadores, búsqueda por nombre o email, filtro por estado de la
 * cuenta y el listado paginado. La búsqueda y el filtro quedan en la URL (`?q=…&estado=activos`).
 */
export function StudentsPage() {
  const { user } = useAuth();
  const { search, setSearch, keyword, filter, setFilter } = useSearchAndFilter(
    'estado',
    ['activos', 'inactivos'],
  );
  const status =
    STATUS_FILTERS.find(({ param }) => param === filter) ?? STATUS_FILTERS[0];

  return (
    <>
      <PageHeader
        eyebrow={`Coach ${user?.first_name ?? ''}`.trim()}
        title="Mis alumnos"
        actions={
          <>
            <MembershipsButton />
            <AccountLink />
          </>
        }
      />
      <div className={styles.counters}>
        <StudentCounters />
      </div>
      <SearchInput
        placeholder="Buscar por nombre o email"
        value={search}
        maxLength={KEYWORD_MAX_LENGTH}
        autoComplete="off"
        onChange={(event) => setSearch(event.target.value)}
      />
      <ChipGroup aria-label="Estado de la cuenta">
        {STATUS_FILTERS.map(({ label, param }) => (
          <Chip
            key={label}
            selected={param === status.param}
            onClick={() => setFilter(param)}
          >
            {label}
          </Chip>
        ))}
      </ChipGroup>
      <StudentList keyword={keyword} active={status.active} />
    </>
  );
}
