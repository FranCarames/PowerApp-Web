import { Icon } from '@/shared/icons';
import { VisuallyHidden } from '@/shared/ui';

import styles from './HistoryNote.module.css';

/** La nota del alumno entre comillas, con el ícono de nota (`.hnote` del prototipo). */
export function HistoryNote({ note }: { note: string }) {
  return (
    <p className={styles.note}>
      <Icon name="note" size={15} className={styles.icon} />
      <span>
        <VisuallyHidden>Nota del alumno: </VisuallyHidden>«{note}»
      </span>
    </p>
  );
}
