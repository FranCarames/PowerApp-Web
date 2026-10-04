import { useId, type ComponentProps } from 'react';

import { Field } from './Field';
import { Input } from './Input';
import styles from './PhoneField.module.css';

interface PhoneFieldProps {
  label?: string;
  /** Las props del código de país y del número: lo que devuelve `register('phone_prefix')`. */
  prefixProps: ComponentProps<'input'>;
  numberProps: ComponentProps<'input'>;
  prefixInvalid?: boolean;
  numberInvalid?: boolean;
  /** Un solo mensaje para los dos controles: el del primero que falle. */
  error?: string;
}

/**
 * Teléfono: el código de país (76 px) y el número, bajo una sola etiqueta. La etiqueta es la del
 * número; el código tiene su propio `id` y un `aria-label`, o los dos controles compartirían id.
 */
export function PhoneField({
  label = 'Teléfono',
  prefixProps,
  numberProps,
  prefixInvalid,
  numberInvalid,
  error,
}: PhoneFieldProps) {
  const prefixId = useId();

  return (
    <Field label={label} error={error}>
      <div className={styles.phone}>
        <Input
          id={prefixId}
          aria-label="Código de país"
          autoComplete="tel-country-code"
          invalid={prefixInvalid}
          {...prefixProps}
        />
        <Input
          type="tel"
          autoComplete="tel-national"
          placeholder="11 2345 6789"
          invalid={numberInvalid}
          {...numberProps}
        />
      </div>
    </Field>
  );
}
