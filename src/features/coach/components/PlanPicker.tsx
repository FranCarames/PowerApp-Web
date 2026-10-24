import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';

import { getErrorMessage } from '@/api/errors';
import type { PlanificationListItem } from '@/api/types';
import { usePlanifications } from '@/features/catalog/hooks/usePlanifications';
import { formatWeeks } from '@/shared/lib/format';
import { capitalize, matchesSearch } from '@/shared/lib/text';
import { KEYWORD_MAX_LENGTH } from '@/shared/lib/useSearchAndFilter';
import {
  Button,
  EmptyState,
  ErrorState,
  List,
  ListItem,
  ListSkeleton,
  SearchInput,
} from '@/shared/ui';

interface PlanPickerProps {
  /** La planificación elegida, o `null` si todavía no hay. */
  plan: PlanificationListItem | null;
  onChange: (plan: PlanificationListItem | null) => void;
}

/** "8 semanas · Fuerza", y "3 rutinas" de acento: lo que se ve de una planificación al elegirla. */
function PlanRow({
  plan,
  onClick,
  trailing,
}: {
  plan: PlanificationListItem;
  onClick?: () => void;
  trailing?: ReactNode;
}) {
  const { name, duration, type, routine_count } = plan;
  return (
    <ListItem
      title={name || 'Sin nombre'}
      subtitle={`${formatWeeks(duration)}${type ? ` · ${capitalize(type)}` : ''}`}
      meta={`${routine_count} rutina${routine_count === 1 ? '' : 's'}`}
      trailing={trailing}
      onClick={onClick}
    />
  );
}

/**
 * La planificación que se le asigna a un alumno. Sin elegir, un buscador y las planificaciones que se
 * pueden asignar: las activas con al menos una rutina vigente (CU-E-13, precondición); elegida, solo su
 * fila con "Cambiar", para que el resto del formulario quede a la vista.
 */
export function PlanPicker({ plan, onChange }: PlanPickerProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const plans = usePlanifications({ includeInactive: false });

  if (plan) {
    return (
      <PlanRow
        plan={plan}
        trailing={
          <Button sm variant="ghost" onClick={() => onChange(null)}>
            Cambiar
          </Button>
        }
      />
    );
  }

  if (plans.isError) {
    return (
      <ErrorState
        message={getErrorMessage(plans.error)}
        onRetry={() => void plans.refetch()}
        retrying={plans.isRefetching}
      />
    );
  }
  if (!plans.data) return <ListSkeleton columns={1} rows={3} />;

  const assignable = plans.data.filter(
    ({ active, routine_count }) => active && routine_count > 0,
  );
  if (assignable.length === 0) {
    return (
      <EmptyState
        icon="calendar"
        title="No hay planificaciones para asignar"
        message="Una planificación tiene que estar activa y tener al menos una rutina."
        action={
          <Button sm onClick={() => navigate('/c/planes')}>
            Ir a Planes
          </Button>
        }
      />
    );
  }

  const visible = assignable.filter(
    ({ name, description }) =>
      matchesSearch(name ?? '', search) ||
      matchesSearch(description ?? '', search),
  );

  return (
    <>
      <SearchInput
        placeholder="Buscar planificación"
        value={search}
        maxLength={KEYWORD_MAX_LENGTH}
        autoComplete="off"
        onChange={(event) => setSearch(event.target.value)}
      />
      {visible.length === 0 ? (
        <EmptyState
          icon="search"
          message="No hay planificaciones que coincidan con la búsqueda."
        />
      ) : (
        <List columns={1} gap={8}>
          {visible.map((item) => (
            <PlanRow key={item.id} plan={item} onClick={() => onChange(item)} />
          ))}
        </List>
      )}
    </>
  );
}
