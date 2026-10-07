import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';

import { getErrorMessage } from '@/api/errors';
import type { MembershipStatusFilter, StudentMembership } from '@/api/pending';
import { useMembershipTypes } from '@/features/account/hooks/useMembershipTypes';
import { fullName } from '@/shared/lib/fullName';
import { matchesSearch } from '@/shared/lib/text';
import { useSearchAndFilter } from '@/shared/lib/useSearchAndFilter';
import {
  Button,
  Chip,
  ChipGroup,
  EmptyState,
  ErrorState,
  List,
  ListSkeleton,
  PageHeader,
  SearchInput,
  Select,
} from '@/shared/ui';

import { MembershipCounters } from '../components/MembershipCounters';
import { MembershipRow } from '../components/MembershipRow';
import { useMembershipStudents } from '../hooks/useMembershipStudents';
import styles from './MembershipsPage.module.css';

/** Los chips de estado, con el valor que llevan en la URL y el `status` que se le pide al backend. */
const STATUS_FILTERS: ReadonlyArray<{
  label: string;
  param: string | null;
  status: MembershipStatusFilter | null;
}> = [
  { label: 'Todas', param: null, status: null },
  { label: 'Activas', param: 'activas', status: 'active' },
  { label: 'Por vencer', param: 'por-vencer', status: 'expiring_soon' },
  { label: 'Vencidas', param: 'vencidas', status: 'expired' },
  { label: 'Sin pagos', param: 'sin-pagos', status: 'no_payments' },
];

const STATUS_PARAMS = STATUS_FILTERS.flatMap(({ param }) =>
  param ? [param] : [],
);

/** Primero los que vencen antes (los vencidos hace más tiempo y, después, los que están por vencer) y al final los que nunca pagaron. */
function byExpiry(a: StudentMembership, b: StudentMembership): number {
  if (a.expired_at === null || b.expired_at === null) {
    if (a.expired_at !== b.expired_at) return a.expired_at === null ? 1 : -1;
  } else if (a.expired_at !== b.expired_at) {
    return a.expired_at.localeCompare(b.expired_at);
  }
  return fullName(a).localeCompare(fullName(b), 'es');
}

/**
 * Control de membresías del Entrenador (CU-E-25 a CU-E-28): los contadores por estado, los alumnos
 * con su vencimiento y la acción de registrar un pago. Se filtra por estado (chips, que piden solo
 * ese estado al backend), por tipo de membresía (el del último pago del alumno) y con una búsqueda
 * por nombre o email, que se resuelve acá porque el backend manda a todos los alumnos sin paginar.
 * La búsqueda y el estado quedan en la URL (`?q=…&estado=vencidas`).
 */
export function MembershipsPage() {
  const navigate = useNavigate();
  const { search, setSearch, filter, setFilter } = useSearchAndFilter(
    'estado',
    STATUS_PARAMS,
  );
  const [typeId, setTypeId] = useState('');
  const current =
    STATUS_FILTERS.find(({ param }) => param === filter) ?? STATUS_FILTERS[0];
  const list = useMembershipStudents(current.status);
  const types = useMembershipTypes();

  const visible = useMemo(
    () =>
      list.students
        .filter(
          (student) =>
            (typeId === '' || student.membership_id === typeId) &&
            (matchesSearch(fullName(student), search) ||
              matchesSearch(student.email, search)),
        )
        .sort(byExpiry),
    [list.students, typeId, search],
  );

  return (
    <>
      <PageHeader eyebrow="Organización" title="Membresías" back="/c/alumnos" />
      <div className={styles.counters}>
        <MembershipCounters />
      </div>
      <Button
        icon="plus"
        className={styles.register}
        onClick={() => navigate('/c/pago')}
      >
        Registrar nuevo pago
      </Button>
      <SearchInput
        placeholder="Buscar por nombre o email"
        value={search}
        autoComplete="off"
        onChange={(event) => setSearch(event.target.value)}
      />
      <ChipGroup aria-label="Estado de la membresía">
        {STATUS_FILTERS.map(({ label, param }) => (
          <Chip
            key={label}
            selected={param === current.param}
            onClick={() => setFilter(param)}
          >
            {label}
          </Chip>
        ))}
      </ChipGroup>
      <Select
        aria-label="Tipo de membresía"
        className={styles.type}
        value={typeId}
        disabled={!types.data || types.data.length === 0}
        onChange={(event) => setTypeId(event.target.value)}
      >
        {types.data?.length === 0 ? (
          <option value="">Sin tipos de membresía</option>
        ) : (
          <>
            <option value="">Todos los tipos de membresía</option>
            {types.data?.map(({ id, name, active }) => (
              <option key={id} value={id}>
                {active ? name : `${name} (dado de baja)`}
              </option>
            ))}
          </>
        )}
      </Select>
      {list.error ? (
        <ErrorState
          message={getErrorMessage(list.error)}
          onRetry={list.retry}
          retrying={list.isRefetching}
        />
      ) : list.isPending ? (
        <ListSkeleton columns={2} rows={4} />
      ) : visible.length === 0 ? (
        <EmptyMembershipList
          status={current.status}
          filtering={search.trim() !== '' || typeId !== ''}
        />
      ) : (
        <List columns={2}>
          {visible.map((student) => (
            <MembershipRow key={student.id} student={student} />
          ))}
        </List>
      )}
    </>
  );
}

/** Qué decir cuando no hay alumnos, según el filtro. */
function EmptyMembershipList({
  status,
  filtering,
}: {
  status: MembershipStatusFilter | null;
  filtering: boolean;
}) {
  if (filtering) {
    return (
      <EmptyState
        icon="search"
        title="Sin coincidencias"
        message="No hay alumnos que coincidan con la búsqueda o el tipo elegidos."
      />
    );
  }
  return (
    <EmptyState
      icon="wallet"
      message={
        status === null
          ? 'Todavía no hay alumnos.'
          : 'No hay alumnos en este estado.'
      }
    />
  );
}
