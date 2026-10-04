import type { ComponentProps } from 'react';

import { cx } from '@/shared/lib/cx';

import styles from './Card.module.css';
import type { Tone } from './tone';

interface CardBaseProps {
  /** Tinte suave del fondo y del borde. */
  tone?: Tone;
  /** Contenido en fila, centrado en vertical. */
  row?: boolean;
}

type StaticCardProps = CardBaseProps &
  ComponentProps<'div'> & { onClick?: undefined };

type InteractiveCardProps = CardBaseProps &
  ComponentProps<'button'> & {
    onClick: NonNullable<ComponentProps<'button'>['onClick']>;
    /** Para listas de selección: borde de marca y aria-pressed. */
    selected?: boolean;
  };

/** Con `onClick` se renderiza como <button>; si no, como <div>. */
export function Card(props: StaticCardProps | InteractiveCardProps) {
  if (props.onClick) {
    const { tone, row, selected, className, type = 'button', ...rest } = props;
    return (
      <button
        type={type}
        aria-pressed={selected}
        className={cx(
          styles.card,
          styles.click,
          tone && styles[tone],
          row && styles.row,
          selected && styles.selected,
          className,
        )}
        {...rest}
      />
    );
  }

  const { tone, row, className, ...rest } = props;
  return (
    <div
      className={cx(
        styles.card,
        tone && styles[tone],
        row && styles.row,
        className,
      )}
      {...rest}
    />
  );
}
