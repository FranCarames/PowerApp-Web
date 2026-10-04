import { Link, useLocation } from 'react-router';

import type { User } from '@/api/types';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ROLE_LABEL } from '@/features/auth/roles';
import { Icon } from '@/shared/icons';
import { cx } from '@/shared/lib/cx';
import { fullName } from '@/shared/lib/fullName';
import { Avatar, IconButton, Logo } from '@/shared/ui';

import {
  isNavItemActive,
  NAV,
  ORGANIZATION_NAV,
  type NavItem,
} from './navigation';
import styles from './Sidebar.module.css';

const AVATAR_TONE = { user: 'pri', coach: 'acc', admin: 'gray' } as const;

function SideLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      to={item.to}
      className={cx(styles.item, active && styles.on)}
      aria-current={active ? 'page' : undefined}
    >
      <Icon name={item.icon} />
      {item.label}
    </Link>
  );
}

/** Barra lateral de desktop (desde 960 px): marca, navegación del rol y datos de la sesión. */
export function Sidebar({ user }: { user: User }) {
  const { pathname } = useLocation();
  const { signOut } = useAuth();
  const organization = ORGANIZATION_NAV[user.role];
  const organizationActive = organization.some((item) =>
    isNavItemActive(item, pathname),
  );
  const name = fullName(user);

  return (
    <div className={styles.sidebar}>
      <div className={styles.brand}>
        <Logo size="sm" />
        <div>
          <div className={styles.wordmark}>PowerApp</div>
          <div className={styles.role}>{ROLE_LABEL[user.role]}</div>
        </div>
      </div>

      <nav className={styles.nav} aria-label="Navegación principal">
        {NAV[user.role].map((item) => (
          <SideLink
            key={item.to}
            item={item}
            active={!organizationActive && isNavItemActive(item, pathname)}
          />
        ))}
        {organization.length > 0 && (
          <>
            <div className={styles.sep}>Organización</div>
            {organization.map((item) => (
              <SideLink
                key={item.to}
                item={item}
                active={isNavItemActive(item, pathname)}
              />
            ))}
          </>
        )}
      </nav>

      <div className={styles.foot}>
        <Avatar
          name={name}
          src={user.profile_picture}
          size={36}
          tone={AVATAR_TONE[user.role]}
        />
        <div className={styles.who}>
          <div className={styles.fullName}>{name}</div>
          <div className={styles.role}>{ROLE_LABEL[user.role]}</div>
        </div>
        <IconButton
          variant="ghost"
          icon="logout"
          label="Cerrar sesión"
          onClick={signOut}
          className={styles.logout}
        />
      </div>
    </div>
  );
}
