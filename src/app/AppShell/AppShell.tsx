import { Outlet } from 'react-router';

import { useAuth } from '@/features/auth/hooks/useAuth';

import styles from './AppShell.module.css';
import { Sidebar } from './Sidebar';
import { TabBar } from './TabBar';

/**
 * Marco de las pantallas con sesión: barra lateral en desktop, tab bar abajo en mobile.
 * Las entradas salen del rol de la sesión, así que lo comparten los tres roles y Mi cuenta.
 */
export function AppShell() {
  const { user } = useAuth();
  // <RequireRole> garantiza la sesión antes de llegar acá.
  if (!user) return null;

  return (
    <div className={styles.layout}>
      <Sidebar user={user} />
      <main className={styles.main}>
        <Outlet />
      </main>
      <TabBar role={user.role} />
    </div>
  );
}
