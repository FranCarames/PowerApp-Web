import { UserList } from '@/features/account/components/UserList';
import type { UsersFilter } from '@/features/account/hooks/useUsers';
import { EmptyState } from '@/shared/ui';

import { StudentRow } from './StudentRow';

/** Qué decir cuando no hay alumnos, según lo que se estaba buscando (CU-E-01 y CU-E-02). */
function EmptyStudents({ keyword, active }: UsersFilter) {
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

/** Los alumnos de a páginas (CU-E-01) y su búsqueda (CU-E-02): los usuarios con `role=user`. */
export function StudentList({
  keyword,
  active,
}: Pick<UsersFilter, 'keyword' | 'active'>) {
  return (
    <UserList
      filter={{ role: 'user', keyword, active }}
      empty={<EmptyStudents keyword={keyword} active={active} />}
      renderRow={(student) => <StudentRow key={student.id} student={student} />}
    />
  );
}
