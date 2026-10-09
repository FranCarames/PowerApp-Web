import { Skeleton, VisuallyHidden } from '@/shared/ui';

import styles from './ExerciseSheetSkeleton.module.css';

/** La forma de la ficha mientras llegan los datos: la cabecera, la descripción y un tip. */
export function ExerciseSheetSkeleton() {
  return (
    <div className={styles.sheet} aria-busy="true">
      <VisuallyHidden role="status">Cargando el ejercicio…</VisuallyHidden>
      <Skeleton height={150} radius={20} />
      <div className={styles.block}>
        <Skeleton width={90} height={12} />
        <Skeleton height={14} />
        <Skeleton height={14} />
        <Skeleton width="70%" height={14} />
      </div>
      <div className={styles.block}>
        <Skeleton width={120} height={12} />
        <Skeleton height={56} radius={12} />
      </div>
    </div>
  );
}
