import type { ReactNode } from 'react';

import styles from './AuthCard.module.css';

/** Columna centrada de las pantallas de acceso (.auth y .auth-card del prototipo). */
export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <main className={styles.auth}>
      <div className={styles.card}>{children}</div>
    </main>
  );
}
