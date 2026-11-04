import { Stat, StatGrid } from '@/shared/ui';

import styles from './HistoryStats.module.css';

/** Más de 6 caracteres («Hace 3 días») baja el valor de 22 a 15 px (6.1). */
const COMPACT_FROM = 7;

/** Las tres tarjetas de resumen del historial (6.1, 7.1 y 8.2), más apretadas que las de otras pantallas. */
export function HistoryStats({
  stats,
}: {
  stats: ReadonlyArray<{ value: string | number; label: string }>;
}) {
  return (
    <StatGrid className={styles.stats}>
      {stats.map(({ value, label }) => (
        <Stat
          key={label}
          value={value}
          label={label}
          compact={String(value).length >= COMPACT_FROM}
          className={styles.stat}
        />
      ))}
    </StatGrid>
  );
}
