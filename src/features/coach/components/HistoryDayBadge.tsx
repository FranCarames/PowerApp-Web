import { dayParts, type Day } from '@/shared/lib/trainingHistory';

import styles from './HistoryDayBadge.module.css';

/** El día («4», grande, en monoespaciada) y el mes («nov») de una tarjeta de sesión (`.hday` del prototipo). */
export function HistoryDayBadge({ day }: { day: Day }) {
  const { date, month } = dayParts(day);
  return (
    <span className={styles.day}>
      <b>{date}</b>
      <span>{month}</span>
    </span>
  );
}
