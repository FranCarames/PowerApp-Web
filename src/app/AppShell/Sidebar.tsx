import { Fragment } from 'react';
import { Link, useLocation } from 'react-router';

import type { User } from '@/api/types';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ROLE_AVATAR_TONE, ROLE_LABEL } from '@/features/auth/roles';
import { Icon } from '@/shared/icons';
import { cx } from '@/shared/lib/cx';
import { fullName } from '@/shared/lib/fullName';
import { Avatar, IconButton, Logo } from '@/shared/ui';

import { isNavItemActive, SIDEBAR, type NavItem } from './navigation';
import styles from './Sidebar.module.css';

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
        {SIDEBAR[user.role].map(({ title, items }, index) => (
          <Fragment key={title ?? index}>
            {title && <div className={styles.sep}>{title}</div>}
            {items.map((item) => (
              <SideLink
                key={item.to}
                item={item}
                active={isNavItemActive(item, pathname)}
              />
            ))}
          </Fragment>
        ))}
      </nav>

      <div className={styles.foot}>
        <Avatar
          name={name}
          src={user.profile_picture}
          size={36}
          tone={ROLE_AVATAR_TONE[user.role]}
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
