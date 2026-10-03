import type { ComponentProps } from 'react';

import { cx } from '@/shared/lib/cx';

import { useFieldControl } from './FieldContext';
import styles from './Input.module.css';

interface InputProps extends ComponentProps<'input'> {
  /** Estado de error. Dentro de un <Field> sale del `error` del Field. */
  invalid?: boolean;
}

export function Input({
  invalid,
  id,
  'aria-describedby': describedBy,
  className,
  ...rest
}: InputProps) {
  const { isInvalid, props } = useFieldControl({
    id,
    invalid,
    'aria-describedby': describedBy,
  });

  return (
    <input
      className={cx(styles.input, isInvalid && styles.invalid, className)}
      {...props}
      {...rest}
    />
  );
}
