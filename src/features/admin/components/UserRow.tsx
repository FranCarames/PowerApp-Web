import type { User } from '@/api/types';
import { ROLE_LABEL } from '@/features/auth/roles';
import { cx } from '@/shared/lib/cx';
import { fullName } from '@/shared/lib/fullName';
import {
  MEMBERSHIP_STATUS_LABEL,
  type MembershipStatus,
} from '@/shared/lib/membershipStatus';
import { Avatar, ListItem, Pill } from '@/shared/ui';

import styles from './UserRow.module.css';

const ROLE_TONE = { user: 'mut', coach: 'acc', admin: 'pri' } as const;

interface UserRowProps {
  user: User;
  /** El estado de membresía, si es un alumno y ya se sabe. Sin él, la fila no lo dice. */
  membership?: MembershipStatus;
  onSelect: (user: User) => void;
}

/**
 * Un usuario del listado: avatar, nombre, email (y la membresía, de un alumno), su rol y, si la
 * cuenta está dada de baja, "Inactivo" y la fila apagada. Abre su detalle.
 */
export function UserRow({ user, membership, onSelect }: UserRowProps) {
  const name = fullName(user);
  // "Sin pagos" no es un estado de la membresía sino su falta: no se dice en la fila.
  const showMembership = membership && membership !== 'no_payments';

  return (
    <ListItem
      className={cx(!user.active && styles.inactive)}
      leading={
        <Avatar
          name={name}
          src={user.profile_picture}
          tone={!user.active ? 'gray' : user.role === 'coach' ? 'acc' : 'pri'}
        />
      }
      title={name}
      subtitle={
        <span className={styles.subtitle}>
          {user.email}
          {showMembership &&
            ` · membresía ${MEMBERSHIP_STATUS_LABEL[membership].toLowerCase()}`}
        </span>
      }
      trailing={
        <span className={styles.pills}>
          <Pill tone={ROLE_TONE[user.role]}>{ROLE_LABEL[user.role]}</Pill>
          {!user.active && <Pill tone="warn">Inactivo</Pill>}
        </span>
      }
      onClick={() => onSelect(user)}
    />
  );
}
