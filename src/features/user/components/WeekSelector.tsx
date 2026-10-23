import { addDays, formatDayRange, weeksBetween } from '@/shared/lib/dates';
import { IconButton } from '@/shared/ui';

import styles from './WeekSelector.module.css';

interface WeekSelectorProps {
  /** El lunes de la semana que se ve (`YYYY-MM-DD`). */
  weekStart: string;
  /** El día de hoy, para decir si es esta semana, la pasada o la próxima. */
  today: string;
  onChange: (weekStart: string) => void;
}

/** "Esta semana", "Semana pasada", "Hace 3 semanas"... según cuántas semanas hay hasta hoy. */
function weekLabel(offset: number): string {
  if (offset === 0) return 'Esta semana';
  if (offset === -1) return 'Semana pasada';
  if (offset === 1) return 'Próxima semana';
  return offset < 0 ? `Hace ${-offset} semanas` : `En ${offset} semanas`;
}

/** El selector de semana del home: anterior, la semana con su rango de días y siguiente (.week del prototipo). */
export function WeekSelector({
  weekStart,
  today,
  onChange,
}: WeekSelectorProps) {
  return (
    <div className={styles.week}>
      <IconButton
        icon="chevL"
        size="sm"
        label="Semana anterior"
        onClick={() => onChange(addDays(weekStart, -7))}
      />
      <div className={styles.label} aria-live="polite">
        <b>{weekLabel(weeksBetween(today, weekStart))}</b>
        <span>{formatDayRange(weekStart, addDays(weekStart, 6))}</span>
      </div>
      <IconButton
        icon="chev"
        size="sm"
        label="Semana siguiente"
        onClick={() => onChange(addDays(weekStart, 7))}
      />
    </div>
  );
}
