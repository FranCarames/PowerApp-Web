import type { ComponentProps } from 'react';

import { Icon, type IconName } from '@/shared/icons';
import { cx } from '@/shared/lib/cx';

import styles from './Note.module.css';
import type { Tone } from './tone';

interface NoteProps extends ComponentProps<'div'> {
  /** `acc` informa y `warn` advierte, como en el prototipo. Los demás siguen la misma regla. */
  tone?: Tone;
  icon?: IconName;
}

/** Aviso en línea. Para uno que tenga que anunciarse al aparecer (un error), pasá `role="alert"`. */
export function Note({
  tone = 'acc',
  icon,
  className,
  children,
  ...rest
}: NoteProps) {
  return (
    <div className={cx(styles.note, styles[tone], className)} {...rest}>
      {icon && <Icon name={icon} size={18} />}
      <span>{children}</span>
    </div>
  );
}
