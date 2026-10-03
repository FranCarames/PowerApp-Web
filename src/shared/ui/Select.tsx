import type { ComponentProps } from 'react';

import { cx } from '@/shared/lib/cx';

import { useFieldControl } from './FieldContext';
import inputStyles from './Input.module.css';
import styles from './Select.module.css';

interface SelectProps extends ComponentProps<'select'> {
  invalid?: boolean;
}

/** <select> nativo con el aspecto de los demás campos. Las opciones van como <option> hijos. */
export function Select({
  invalid,
  id,
  'aria-describedby': describedBy,
  className,
  ...rest
}: SelectProps) {
  const { isInvalid, props } = useFieldControl({
    id,
    invalid,
    'aria-describedby': describedBy,
  });

  return (
    <select
      className={cx(
        inputStyles.input,
        styles.select,
        isInvalid && inputStyles.invalid,
        className,
      )}
      {...props}
      {...rest}
    />
  );
}
