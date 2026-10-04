import { useId, type ReactNode } from 'react';

import { cx } from '@/shared/lib/cx';

import styles from './Field.module.css';
import { FieldContext } from './FieldContext';

interface FieldProps {
  label: string;
  /** Mensaje de error: pinta el control en rojo y se anuncia a los lectores de pantalla. */
  error?: string;
  /** Texto de ayuda bajo el control. Se reemplaza por el error cuando lo hay. */
  hint?: string;
  /** El control: <Input>, <PasswordInput>, <Select> o <Textarea>. Toma el id y el estado de acá. */
  children: ReactNode;
  className?: string;
}

export function Field({ label, error, hint, children, className }: FieldProps) {
  const id = useId();
  const messageId = `${id}-message`;
  const message = error ?? hint;

  return (
    <FieldContext
      value={{
        id,
        invalid: Boolean(error),
        describedBy: message ? messageId : undefined,
      }}
    >
      <div className={cx(styles.field, className)}>
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
        {children}
        {message && (
          <div
            id={messageId}
            role={error ? 'alert' : undefined}
            className={cx(styles.message, error && styles.error)}
          >
            {message}
          </div>
        )}
      </div>
    </FieldContext>
  );
}
