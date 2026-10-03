import type { ComponentProps } from 'react';

import { cx } from '@/shared/lib/cx';

import { useFieldControl } from './FieldContext';
import inputStyles from './Input.module.css';
import styles from './Textarea.module.css';

interface TextareaProps extends ComponentProps<'textarea'> {
  invalid?: boolean;
}

export function Textarea({
  invalid,
  id,
  'aria-describedby': describedBy,
  className,
  ...rest
}: TextareaProps) {
  const { isInvalid, props } = useFieldControl({
    id,
    invalid,
    'aria-describedby': describedBy,
  });

  return (
    <textarea
      className={cx(
        inputStyles.input,
        styles.textarea,
        isInvalid && inputStyles.invalid,
        className,
      )}
      {...props}
      {...rest}
    />
  );
}
