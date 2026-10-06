import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useSearchParams } from 'react-router';

import { getErrorMessage } from '@/api/errors';
import type { User } from '@/api/types';
import { UserList } from '@/features/account/components/UserList';
import { useUser } from '@/features/account/hooks/useUser';
import { ROLE_LABEL } from '@/features/auth/roles';
import { fullName } from '@/shared/lib/fullName';
import { useDebouncedValue } from '@/shared/lib/useDebouncedValue';
import {
  KEYWORD_MAX_LENGTH,
  SEARCH_DEBOUNCE_MS,
} from '@/shared/lib/useSearchAndFilter';
import {
  Avatar,
  EmptyState,
  ListItem,
  Note,
  PageHeader,
  SearchInput,
} from '@/shared/ui';

import { ConvertForm } from '../components/ConvertForm';
import { coachesQuery } from '../hooks/useCoaches';
import styles from './ConvertPage.module.css';

/**
 * El alumno que llega elegido por `?alumno=<id>` (desde Usuarios) o, si no se lo puede convertir, el
 * motivo. Solo se convierte a un alumno con la cuenta activa: un entrenador ya lo es (CU-A-17: el
 * sistema informa y no cambia nada) y un admin no es un alumno.
 */
function usePreselectedStudent(id: string | null): {
  student?: User;
  problem?: string;
} {
  const query = useUser(id);
  if (id === null || query.isPending) return {};
  if (query.isError) {
    return {
      problem: getErrorMessage(query.error, {
        404: 'No encontramos al alumno que elegiste.',
      }),
    };
  }

  const user = query.data;
  const name = fullName(user);
  if (user.role === 'coach') return { problem: `${name} ya es entrenador.` };
  if (user.role !== 'user') {
    return {
      problem: `${name} es ${ROLE_LABEL[user.role].toLowerCase()} y no se puede convertir.`,
    };
  }
  if (!user.active) {
    return {
      problem: `La cuenta de ${name} está inactiva. Reactivala desde Usuarios para poder convertirla en entrenador.`,
    };
  }
  return { student: user };
}

/**
 * Convertir alumno en entrenador (CU-A-17): se elige a un alumno activo (puede llegar elegido desde
 * Usuarios con `?alumno=<id>`), se cargan su email profesional y su CUIL y se lo convierte. También es
 * la forma de reactivar a un entrenador eliminado: vuelve a ser un alumno y acá se lo convierte de nuevo.
 */
export function ConvertPage() {
  const [params] = useSearchParams();
  const preselected = usePreselectedStudent(params.get('alumno'));
  const [chosen, setChosen] = useState<User | null>(null);
  const [search, setSearch] = useState('');
  const keyword = useDebouncedValue(search, SEARCH_DEBOUNCE_MS).trim();
  // Los registros de Coach: de ahí sale si el alumno ya fue entrenador y qué emails están usados.
  const coaches = useQuery(coachesQuery());

  const selected = chosen ?? preselected.student ?? null;
  const previous = selected
    ? coaches.data?.find(({ id }) => id === selected.id)
    : undefined;

  return (
    <>
      <PageHeader
        eyebrow="Nuevo entrenador"
        title="Convertir alumno"
        back="/a/entrenadores"
      />
      <div className={styles.narrow}>
        <p className={styles.intro}>
          Elegí un alumno para convertirlo en entrenador. Va a tener acceso al
          panel de entrenador.
        </p>
        {preselected.problem && (
          <Note tone="warn" icon="alert" className={styles.note}>
            {preselected.problem}
          </Note>
        )}
        <SearchInput
          placeholder="Buscar alumno"
          value={search}
          maxLength={KEYWORD_MAX_LENGTH}
          autoComplete="off"
          onChange={(event) => setSearch(event.target.value)}
        />
        <div className={styles.students}>
          <UserList
            columns={1}
            gap={8}
            filter={{ role: 'user', active: true, keyword }}
            empty={
              <EmptyState
                icon={keyword ? 'search' : 'users'}
                message={
                  keyword
                    ? 'No hay alumnos activos que coincidan con la búsqueda.'
                    : 'No hay alumnos activos para convertir.'
                }
              />
            }
            renderRow={(user) => (
              <ListItem
                key={user.id}
                leading={
                  <Avatar
                    name={fullName(user)}
                    src={user.profile_picture}
                    size={36}
                  />
                }
                title={fullName(user)}
                subtitle={user.email}
                selected={user.id === selected?.id}
                onClick={() => setChosen(user)}
              />
            )}
          />
        </div>
        <ConvertForm
          key={previous?.id ?? 'new'}
          student={selected}
          previous={previous}
          coaches={coaches.data}
        />
      </div>
    </>
  );
}
