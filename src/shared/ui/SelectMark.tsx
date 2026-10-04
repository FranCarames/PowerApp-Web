import { Icon } from '@/shared/icons';
import { cx } from '@/shared/lib/cx';

import styles from './SelectMark.module.css';

/** Círculo de selección del final de una fila (.radio del prototipo). Es decorativo: el estado va en el botón. */
export function SelectMark({ checked }: { checked: boolean }) {
  return (
    <span aria-hidden="true" className={cx(styles.mark, checked && styles.on)}>
      {checked && <Icon name="check" size={13} />}
    </span>
  );
}
