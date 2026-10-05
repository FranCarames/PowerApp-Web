import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';

import { AccountLink } from '@/features/account/components/AccountLink';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useDebouncedValue } from '@/shared/lib/useDebouncedValue';
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

/** Espera entre la última tecla y el pedido al backend. */
const SEARCH_DEBOUNCE_MS = 300;

/** El backend rechaza una búsqueda de más de 100 caracteres (`GetUsersQueryDto.keyword`). */
const SEARCH_MAX_LENGTH = 100;

/**
 * Mis alumnos (CU-E-01 y CU-E-02): contadores, búsqueda por nombre o email, filtro por estado de la
 * cuenta y el listado paginado.
 *
 * La búsqueda y el filtro se copian a la URL (`?q=…&estado=activos`) y se leen de ahí solo al abrir
 * la pantalla: al volver del detalle de un alumno, la lista queda como estaba.
 */
export function StudentsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { search: urlSearch } = useLocation();

  const [statusParam, setStatusParam] = useState(() =>
    new URLSearchParams(urlSearch).get('estado'),
  );
  const status =
    STATUS_FILTERS.find((filter) => filter.param === statusParam) ??
    STATUS_FILTERS[0];

  // Lo que se tipea se ve al instante; el backend recibe el texto cuando la mano se detiene.
  const [search, setSearch] = useState(
    () => new URLSearchParams(urlSearch).get('q') ?? '',
  );
  const keyword = useDebouncedValue(search, SEARCH_DEBOUNCE_MS).trim();

  useEffect(() => {
    const params = new URLSearchParams();
    if (keyword) params.set('q', keyword);
    if (status.param) params.set('estado', status.param);
    const next = params.size > 0 ? `?${params}` : '';
    if (next !== urlSearch) navigate({ search: next }, { replace: true });
  }, [keyword, status.param, urlSearch, navigate]);

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
        maxLength={SEARCH_MAX_LENGTH}
        autoComplete="off"
        onChange={(event) => setSearch(event.target.value)}
      />
      <ChipGroup aria-label="Estado de la cuenta">
        {STATUS_FILTERS.map(({ label, param }) => (
          <Chip
            key={label}
            selected={param === status.param}
            onClick={() => setStatusParam(param)}
          >
            {label}
          </Chip>
        ))}
      </ChipGroup>
      <StudentList keyword={keyword} active={status.active} />
    </>
  );
}
