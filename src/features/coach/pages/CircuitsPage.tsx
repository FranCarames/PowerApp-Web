import { CircuitList } from '@/features/catalog/components/CircuitList';
import { PageHeader } from '@/shared/ui';

import { RoutinesSegments } from '../components/RoutinesSegments';
import styles from './CircuitsPage.module.css';

/**
 * Circuitos del Entrenador (CU-E-21), el segundo segmento del tab Rutinas: el mismo listado del Admin
 * (`CircuitList`). Tocar un circuito abre su editor en `/c/circuitos/:id`.
 */
export function CircuitsPage() {
  return (
    <>
      <PageHeader eyebrow="Sistémicas" title="Circuitos" />
      <RoutinesSegments value="circuitos" />
      <p className={styles.intro}>
        Un circuito se puede usar en varias rutinas. Si lo editás, el cambio se
        aplica en todas las que lo usan.
      </p>
      <CircuitList basePath="/c/circuitos" />
    </>
  );
}
