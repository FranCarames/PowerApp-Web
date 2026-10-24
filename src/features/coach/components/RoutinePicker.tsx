import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';

import { getErrorMessage } from '@/api/errors';
import type { RoutineListItemPlus } from '@/api/types';
import { useRoutines } from '@/features/catalog/hooks/useRoutines';
import { matchesSearch } from '@/shared/lib/text';
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

interface RoutinePickerProps {
  /** La rutina elegida, o `null` si todavía no hay. */
  routine: RoutineListItemPlus | null;
  onChange: (routine: RoutineListItemPlus | null) => void;
}

/** La rutina con su nota y "3 circuitos" de acento: lo que se ve de ella al elegirla. */
function RoutineRow({
  routine,
  onClick,
  trailing,
}: {
  routine: RoutineListItemPlus;
  onClick?: () => void;
  trailing?: ReactNode;
}) {
  const { name, coach_note, circuit_count } = routine;
  return (
    <ListItem
      title={name}
      // El backend manda `null` en la nota que no tiene, aunque el contrato la declara opcional.
      subtitle={coach_note || undefined}
      meta={
        circuit_count === 0
          ? 'Sin circuitos'
          : `${circuit_count} circuito${circuit_count === 1 ? '' : 's'}`
      }
      trailing={trailing}
      onClick={onClick}
    />
  );
}

/**
 * La rutina que se le asigna a un alumno para un día. Sin elegir, un buscador y las rutinas vigentes
 * (CU-E-19, precondición: una dada de baja no se puede asignar y el backend no la ofrece en este listado);
 * elegida, solo su fila con "Cambiar", para que el resto del formulario quede a la vista.
 */
export function RoutinePicker({ routine, onChange }: RoutinePickerProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const routines = useRoutines({ includeInactive: false });

  if (routine) {
    return (
      <RoutineRow
        routine={routine}
        trailing={
          <Button sm variant="ghost" onClick={() => onChange(null)}>
            Cambiar
          </Button>
        }
      />
    );
  }

  if (routines.isError) {
    return (
      <ErrorState
        message={getErrorMessage(routines.error)}
        onRetry={() => void routines.refetch()}
        retrying={routines.isRefetching}
      />
    );
  }
  if (!routines.data) return <ListSkeleton columns={1} rows={3} />;

  const assignable = routines.data.filter(({ active }) => active);
  if (assignable.length === 0) {
    return (
      <EmptyState
        icon="list"
        title="No hay rutinas para asignar"
        message="Todavía no hay rutinas vigentes. Creá una para poder asignarla."
        action={
          <Button sm onClick={() => navigate('/c/rutinas')}>
            Ir a Rutinas
          </Button>
        }
      />
    );
  }

  const visible = assignable.filter(
    ({ name, coach_note }) =>
      matchesSearch(name, search) || matchesSearch(coach_note ?? '', search),
  );

  return (
    <>
      <SearchInput
        placeholder="Buscar rutina"
        value={search}
        maxLength={KEYWORD_MAX_LENGTH}
        autoComplete="off"
        onChange={(event) => setSearch(event.target.value)}
      />
      {visible.length === 0 ? (
        <EmptyState
          icon="search"
          message="No hay rutinas que coincidan con la búsqueda."
        />
      ) : (
        <List columns={1} gap={8}>
          {visible.map((item) => (
            <RoutineRow
              key={item.id}
              routine={item}
              onClick={() => onChange(item)}
            />
          ))}
        </List>
      )}
    </>
  );
}
