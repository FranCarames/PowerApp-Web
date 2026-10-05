import { useNavigate } from 'react-router';

import type { User } from '@/api/types';
import { fullName } from '@/shared/lib/fullName';
import { Avatar, ListItem, Pill } from '@/shared/ui';

import styles from './StudentRow.module.css';

/** Un alumno del listado: foto o inicial, nombre, email y el estado de su cuenta. Abre su detalle. */
export function StudentRow({ student }: { student: User }) {
  const navigate = useNavigate();
  const name = fullName(student);

  return (
    <ListItem
      leading={
        <Avatar
          name={name}
          src={student.profile_picture}
          tone={student.active ? 'pri' : 'gray'}
        />
      }
      title={name}
      subtitle={<span className={styles.email}>{student.email}</span>}
      trailing={
        <Pill tone={student.active ? 'ok' : 'warn'}>
          {student.active ? 'Activo' : 'Inactivo'}
        </Pill>
      }
      onClick={() => navigate(`/c/alumnos/${student.id}`)}
    />
  );
}
