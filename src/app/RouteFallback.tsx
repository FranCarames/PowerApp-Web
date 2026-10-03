import { Spinner } from '@/shared/ui';

import styles from './RouteFallback.module.css';

/** Se muestra mientras una ruta asíncrona (lazy o con loader) termina de cargar. */
export function RouteFallback() {
  return (
    <div className={styles.fallback}>
      <Spinner size={28} />
    </div>
  );
}
