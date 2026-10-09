import { formatClock } from '@/shared/lib/format';

import type { RestTimerStatus } from '../restTimerStore';
import styles from './RestTimerDial.module.css';

const RADIUS = 110;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const STATUS_LABEL: Record<RestTimerStatus, string> = {
  idle: 'listo',
  running: 'restante',
  paused: 'en pausa',
  done: 'Descanso terminado',
};

interface RestTimerDialProps {
  /** Lo que queda, en segundos. */
  left: number;
  /** La duración elegida, en segundos. */
  total: number;
  status: RestTimerStatus;
}

/** El reloj del temporizador: el anillo que se vacía y, en el centro, lo que queda y el estado (.timer del prototipo). */
export function RestTimerDial({ left, total, status }: RestTimerDialProps) {
  return (
    <div className={styles.timer}>
      <svg viewBox="0 0 240 240" aria-hidden="true">
        <circle cx="120" cy="120" r={RADIUS} className={styles.track} />
        <circle
          cx="120"
          cy="120"
          r={RADIUS}
          className={styles.progress}
          style={{
            strokeDasharray: CIRCUMFERENCE,
            strokeDashoffset: CIRCUMFERENCE * (1 - left / total),
          }}
        />
      </svg>
      <div className={styles.center}>
        {/* role="timer" no anuncia cada segundo: el aviso del final lo da el toast. */}
        <div role="timer" className={styles.value}>
          {formatClock(left)}
        </div>
        <div className={styles.label}>{STATUS_LABEL[status]}</div>
      </div>
    </div>
  );
}
