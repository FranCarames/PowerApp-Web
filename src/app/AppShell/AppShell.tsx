import { Outlet, useMatches } from 'react-router';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { cx } from '@/shared/lib/cx';
import { isWideScreen } from '@/shared/lib/routeHandle';

import styles from './AppShell.module.css';
import { Sidebar } from './Sidebar';
import { TabBar } from './TabBar';

/**
 * Marco de las pantallas con sesión: barra lateral en desktop, tab bar abajo en mobile.
 * Las entradas salen del rol de la sesión, así que lo comparten los tres roles y Mi cuenta.
 * Una ruta con `handle: WIDE_SCREEN` (`shared/lib/routeHandle.ts`) usa más ancho en escritorio.
 */
export function AppShell() {
  const { user } = useAuth();
  const wide = isWideScreen(useMatches());
  // <RequireRole> garantiza la sesión antes de llegar acá.
  if (!user) return null;

  return (
    <div className={styles.layout}>
      <Sidebar user={user} />
      <main className={cx(styles.main, wide && styles.wide)}>
        <Outlet />
      </main>
      <TabBar role={user.role} />
    </div>
  );
}
