import { fullName } from '@/shared/lib/fullName';
import { Avatar, IconButton, ListItem, Pill } from '@/shared/ui';

import { isCoachActive, type CoachEntry } from '../hooks/useCoaches';
import styles from './CoachRow.module.css';

interface CoachRowProps {
  entry: CoachEntry;
  /** Editar sus datos profesionales (T37). Mientras no se pasa, la fila no ofrece el botón. */
  onEdit?: (entry: CoachEntry) => void;
  onDelete: (entry: CoachEntry) => void;
}

/**
 * Un entrenador: avatar, nombre, email profesional, si está activo y las acciones. No dice cuántos
 * alumnos tiene (como el prototipo): el backend no tiene un vínculo entrenador-alumno.
 */
export function CoachRow({ entry, onEdit, onDelete }: CoachRowProps) {
  const { user, coach } = entry;
  const name = fullName(user);
  const active = isCoachActive(entry);

  return (
    <ListItem
      leading={
        <Avatar
          name={name}
          src={user.profile_picture}
          tone={active ? 'acc' : 'gray'}
        />
      }
      title={<span className={styles.name}>{name}</span>}
      subtitle={
        <span className={styles.subtitle}>
          {coach?.coach_email ?? 'Sin email profesional'}
        </span>
      }
      trailing={
        <span className={styles.trailing}>
          <Pill tone={active ? 'ok' : 'warn'}>
            {active ? 'Activo' : 'Inactivo'}
          </Pill>
          <span className={styles.actions}>
            {onEdit && (
              <IconButton
                variant="ghost"
                icon="edit"
                label={`Editar ${name}`}
                onClick={() => onEdit(entry)}
              />
            )}
            <IconButton
              variant="ghost"
              danger
              icon="trash"
              label={`Eliminar ${name}`}
              onClick={() => onDelete(entry)}
            />
          </span>
        </span>
      }
    />
  );
}
