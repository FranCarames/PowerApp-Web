import { useRef, type KeyboardEvent } from 'react';

import { Icon, type IconName } from '@/shared/icons';
import { cx } from '@/shared/lib/cx';

import styles from './Tabs.module.css';

interface TabOption<T extends string> {
  value: T;
  label: string;
  icon?: IconName;
  /** El `id` de la pestaña: el panel lo usa en `aria-labelledby`. */
  id: string;
}

interface TabsProps<T extends string> {
  options: ReadonlyArray<TabOption<T>>;
  value: T;
  onChange: (value: T) => void;
  /** Nombre accesible del grupo, p. ej. "Vista del historial". */
  label: string;
  /** El `id` del panel que muestran las pestañas (`role="tabpanel"`). */
  panelId: string;
  className?: string;
}

/**
 * Pestañas con el patrón de tabs de WAI-ARIA y el aspecto del control segmentado (.seg del prototipo).
 * Un solo Tab entra a la elegida; ← y → pasan a la otra y la eligen; Inicio y Fin van a la primera y a
 * la última. El panel lo arma la pantalla, con `role="tabpanel"`, `id={panelId}` y `aria-labelledby`.
 */
export function Tabs<T extends string>({
  options,
  value,
  onChange,
  label,
  panelId,
  className,
}: TabsProps<T>) {
  const buttons = useRef(new Map<T, HTMLButtonElement>());

  function select(index: number) {
    const option = options[(index + options.length) % options.length];
    onChange(option.value);
    buttons.current.get(option.value)?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const moves: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: options.length - 1,
    };
    const next = moves[event.key];
    if (next === undefined) return;
    event.preventDefault();
    select(next);
  }

  return (
    <div
      role="tablist"
      aria-label={label}
      className={cx(styles.tabs, className)}
    >
      {options.map((option, index) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            ref={(node) => {
              if (node) buttons.current.set(option.value, node);
              else buttons.current.delete(option.value);
            }}
            type="button"
            role="tab"
            id={option.id}
            aria-selected={selected}
            aria-controls={panelId}
            tabIndex={selected ? 0 : -1}
            className={cx(selected && styles.on)}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => onKeyDown(event, index)}
          >
            {option.icon && <Icon name={option.icon} size={16} />}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
