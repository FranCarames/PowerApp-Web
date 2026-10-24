import { useState } from 'react';

import type { User } from '@/api/types';
import { UserList } from '@/features/account/components/UserList';
import { fullName } from '@/shared/lib/fullName';
import { useDebouncedValue } from '@/shared/lib/useDebouncedValue';
import {
  KEYWORD_MAX_LENGTH,
  SEARCH_DEBOUNCE_MS,
} from '@/shared/lib/useSearchAndFilter';
import {
  Avatar,
  Button,
  EmptyState,
  ListItem,
  Pill,
  SearchInput,
} from '@/shared/ui';

interface StudentPickerProps {
  /** El alumno elegido, o `null` si todavía no hay. */
  student: User | null;
  onChange: (student: User | null) => void;
  /** Ofrece solo los alumnos con la cuenta abierta. Por defecto se ofrecen todos. */
  activeOnly?: boolean;
}

function StudentAvatar({ student }: { student: User }) {
  return (
    <Avatar
      name={fullName(student)}
      src={student.profile_picture}
      size={36}
      tone={student.active ? 'pri' : 'gray'}
    />
  );
}

/**
 * El alumno elegido para una acción del entrenador. Sin elegir, un buscador y la lista de alumnos (de a
 * páginas); elegido, solo su fila con "Cambiar", para que el resto del formulario quede a la vista.
 * Por defecto se ofrecen también los de cuenta inactiva (el backend deja registrarles un pago y el
 * control de membresías los lista); con `activeOnly`, solo los de cuenta abierta (asignarles una
 * planificación a los otros da 400).
 */
export function StudentPicker({
  student,
  onChange,
  activeOnly = false,
}: StudentPickerProps) {
  const [search, setSearch] = useState('');
  const keyword = useDebouncedValue(search, SEARCH_DEBOUNCE_MS).trim();

  if (student) {
    return (
      <ListItem
        leading={<StudentAvatar student={student} />}
        title={fullName(student)}
        subtitle={student.email}
        trailing={
          <>
            {!student.active && <Pill tone="warn">Inactivo</Pill>}
            <Button sm variant="ghost" onClick={() => onChange(null)}>
              Cambiar
            </Button>
          </>
        }
      />
    );
  }

  return (
    <>
      <SearchInput
        placeholder="Buscar alumno por nombre o email"
        value={search}
        maxLength={KEYWORD_MAX_LENGTH}
        autoComplete="off"
        onChange={(event) => setSearch(event.target.value)}
      />
      <UserList
        columns={1}
        gap={8}
        filter={{ role: 'user', keyword, active: activeOnly || undefined }}
        empty={
          <EmptyState
            icon={keyword ? 'search' : 'users'}
            message={
              keyword
                ? 'No hay alumnos que coincidan con la búsqueda.'
                : 'Todavía no hay alumnos.'
            }
          />
        }
        renderRow={(user) => (
          <ListItem
            key={user.id}
            leading={<StudentAvatar student={user} />}
            title={fullName(user)}
            subtitle={user.email}
            trailing={
              !user.active ? <Pill tone="warn">Inactivo</Pill> : undefined
            }
            onClick={() => onChange(user)}
          />
        )}
      />
    </>
  );
}
