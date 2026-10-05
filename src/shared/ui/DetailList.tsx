import type { ReactNode } from 'react';

import { cx } from '@/shared/lib/cx';

import styles from './DetailList.module.css';

interface DetailListProps {
  items: Array<{ label: string; value: ReactNode }>;
  className?: string;
}

/** Datos de una ficha en filas de "nombre y valor", como las de un modal de detalle (.trow del prototipo). */
export function DetailList({ items, className }: DetailListProps) {
  return (
    <dl className={cx(styles.list, className)}>
      {items.map(({ label, value }) => (
        <div key={label} className={styles.row}>
          <dt className={styles.label}>{label}</dt>
          <dd className={styles.value}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
