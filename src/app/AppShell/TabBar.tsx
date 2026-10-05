import { Link, useLocation } from 'react-router';

import type { Role } from '@/api/types';
import { Icon } from '@/shared/icons';
import { cx } from '@/shared/lib/cx';

import { activeTabOf, TAB_BAR } from './navigation';
import styles from './TabBar.module.css';

/** Barra de pestañas inferior de mobile. Desde 960 px la reemplaza la barra lateral. */
export function TabBar({ role }: { role: Role }) {
  const { pathname } = useLocation();
  const items = TAB_BAR[role];
  const activeTab = activeTabOf(items, pathname);

  return (
    <nav className={styles.tabbar} aria-label="Navegación principal">
      {items.map((item) => {
        const active = item === activeTab;
        return (
          <Link
            key={item.to}
            to={item.to}
            className={cx(styles.tab, active && styles.on)}
            aria-current={active ? 'page' : undefined}
          >
            <Icon name={item.icon} size={22} />
            <span>{item.label}</span>
            <span aria-hidden="true" className={styles.dot} />
          </Link>
        );
      })}
    </nav>
  );
}
