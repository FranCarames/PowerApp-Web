import type { ComponentProps } from 'react';

import { Icon } from '@/shared/icons';
import { cx } from '@/shared/lib/cx';

import { Input } from './Input';
import styles from './NumberStepper.module.css';

interface NumberStepperProps extends Omit<
  ComponentProps<typeof Input>,
  'value' | 'onChange' | 'type' | 'min' | 'max' | 'step'
> {
  /** El valor como texto: es el que escribe la persona, y el formulario lo valida. */
  value: string;
  onChange: (value: string) => void;
  min: number;
  max: number;
  /** Cuánto suman o restan los botones. Por defecto 1. */
  step?: number;
  /** Decimales que admite el valor (con coma, como en es-AR). Por defecto, ninguno. */
  decimals?: number;
  /** Si el valor es opcional, bajar del mínimo lo vacía en vez de frenar en el mínimo. */
  optional?: boolean;
  /** Qué valor ajusta, para los nombres accesibles de los botones. P. ej. "Series, bloque 1 de Sentadilla". */
  label: string;
}

function toNumber(text: string): number | undefined {
  const value = Number(text.replace(',', '.'));
  return text.trim() !== '' && Number.isFinite(value) ? value : undefined;
}

/**
 * Campo numérico con un botón grande de − a la izquierda y otro de + a la derecha, para ajustar el valor
 * con el pulgar sin abrir el teclado. El valor sigue siendo un input de texto: se puede escribir igual.
 * Desde un campo vacío, + arranca en el primer paso.
 */
export function NumberStepper({
  value,
  onChange,
  min,
  max,
  step = 1,
  decimals = 0,
  optional = false,
  label,
  disabled,
  className,
  ...rest
}: NumberStepperProps) {
  const current = toNumber(value);
  const canDecrease =
    !disabled && current !== undefined && (optional || current > min);
  const canIncrease = !disabled && (current === undefined || current < max);

  function move(direction: 1 | -1) {
    const factor = 10 ** decimals;
    const next =
      Math.round(((current ?? 0) + direction * step) * factor) / factor;
    if (next > max) return onChange(format(max));
    if (next < min) return onChange(optional ? '' : format(min));
    onChange(format(next));
  }

  return (
    <div className={cx(styles.stepper, className)}>
      <button
        type="button"
        className={cx(styles.button, styles.minus)}
        aria-label={`Disminuir ${label}`}
        disabled={!canDecrease}
        onClick={() => move(-1)}
      >
        <Icon name="minus" size={22} />
      </button>
      <Input
        inputMode={decimals > 0 ? 'decimal' : 'numeric'}
        autoComplete="off"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        {...rest}
      />
      <button
        type="button"
        className={cx(styles.button, styles.plus)}
        aria-label={`Aumentar ${label}`}
        disabled={!canIncrease}
        onClick={() => move(1)}
      >
        <Icon name="plus" size={22} />
      </button>
    </div>
  );
}

/** Un número como texto del formulario, con coma decimal. */
function format(value: number): string {
  return String(value).replace('.', ',');
}
