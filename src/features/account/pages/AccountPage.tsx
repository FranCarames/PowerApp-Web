import { useNavigate } from 'react-router';

import type { Role, User } from '@/api/types';
import { ROLE_LABEL } from '@/features/auth/roles';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { IconName } from '@/shared/icons';
import { formatMonthYear } from '@/shared/lib/dates';
import { fullName } from '@/shared/lib/fullName';
import { Avatar, Button, List, ListItem, PageHeader, Tile } from '@/shared/ui';

import { MembershipPill } from '../components/MembershipPill';
import styles from './AccountPage.module.css';

interface MenuItem {
  to: string;
  icon: IconName;
  title: string;
  subtitle: string;
}

const PERSONAL_DATA: MenuItem = {
  to: '/cuenta/datos',
  icon: 'user',
  title: 'Datos personales',
  subtitle: 'Nombre, email y teléfono',
};

const PASSWORD: MenuItem = {
  to: '/cambiar-contrasena',
  icon: 'key',
  title: 'Cambiar contraseña',
  subtitle: 'Seguridad de tu cuenta',
};

/**
 * El menú de cada rol. Datos personales y contraseña son de los tres (el PLAN los comparte); el resto
 * es de cada uno. El historial de pagos es solo del Usuario.
 */
const MENU: Record<Role, MenuItem[]> = {
  user: [
    PERSONAL_DATA,
    {
      to: '/cuenta/pagos',
      icon: 'wallet',
      title: 'Historial de pagos',
      subtitle: 'Tus membresías y pagos',
    },
    {
      to: '/u/rms',
      icon: 'trophy',
      title: 'Mis RMs',
      subtitle: 'Récords por ejercicio',
    },
    {
      to: '/u/wiki',
      icon: 'book',
      title: 'Biblioteca de ejercicios',
      subtitle: 'Técnica y músculos',
    },
    PASSWORD,
  ],
  coach: [
    PERSONAL_DATA,
    {
      to: '/c/membresias',
      icon: 'wallet',
      title: 'Control de membresías',
      subtitle: 'Pagos y vencimientos',
    },
    PASSWORD,
  ],
  admin: [PERSONAL_DATA, PASSWORD],
};

const AVATAR_TONE = { user: 'pri', coach: 'acc', admin: 'gray' } as const;

/** La línea bajo el nombre: desde cuándo es miembro, el rol o, del admin, el email. */
function subtitleFor(user: User): string {
  if (user.role === 'user') {
    return `Miembro desde ${formatMonthYear(user.created_at)}`;
  }
  return user.role === 'coach' ? ROLE_LABEL.coach : user.email;
}

/** Mi cuenta (CU-U-03): quién sos, el menú de tu rol y cerrar sesión. */
export function AccountPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // La ruta pide sesión, así que siempre hay usuario.
  if (!user) return null;
  const name = fullName(user);

  return (
    <>
      <PageHeader title="Mi cuenta" />
      <div className={styles.profile}>
        <Avatar
          name={name}
          src={user.profile_picture}
          size={80}
          tone={AVATAR_TONE[user.role]}
          className={styles.avatar}
        />
        <div className={styles.name}>{name}</div>
        <div className={styles.subtitle}>{subtitleFor(user)}</div>
        {user.role === 'user' && (
          <div className={styles.membership}>
            <MembershipPill userId={user.id} />
          </div>
        )}
      </div>
      <List columns={2}>
        {MENU[user.role].map(({ to, icon, title, subtitle }) => (
          <ListItem
            key={to}
            leading={<Tile icon={icon} />}
            title={title}
            subtitle={subtitle}
            chevron
            onClick={() => navigate(to)}
          />
        ))}
      </List>
      <Button
        variant="danger"
        icon="logout"
        className={styles.signOut}
        onClick={signOut}
      >
        Cerrar sesión
      </Button>
    </>
  );
}
