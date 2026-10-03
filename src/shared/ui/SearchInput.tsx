import type { ComponentProps } from 'react';

import { Icon } from '@/shared/icons';
import { cx } from '@/shared/lib/cx';

import { Input } from './Input';
import styles from './SearchInput.module.css';

type SearchInputProps = Omit<ComponentProps<typeof Input>, 'type'>;

/** Campo de búsqueda con lupa. El nombre accesible sale del placeholder si no se pasa aria-label. */
export function SearchInput({
  className,
  placeholder,
  'aria-label': ariaLabel,
  ...rest
}: SearchInputProps) {
  return (
    <div className={cx(styles.search, className)}>
      <Icon name="search" size={18} className={styles.icon} />
      <Input
        type="search"
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        {...rest}
      />
    </div>
  );
}
