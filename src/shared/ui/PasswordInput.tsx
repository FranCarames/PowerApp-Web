import { useState, type ComponentProps } from 'react';

import { Icon } from '@/shared/icons';

import { Input } from './Input';
import styles from './PasswordInput.module.css';

type PasswordInputProps = Omit<ComponentProps<typeof Input>, 'type'>;

/** Campo de contraseña con botón para mostrar u ocultar lo escrito. */
export function PasswordInput(props: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={styles.pw}>
      <Input type={visible ? 'text' : 'password'} {...props} />
      <button
        type="button"
        className={styles.toggle}
        aria-label="Mostrar contraseña"
        aria-pressed={visible}
        onClick={() => setVisible((current) => !current)}
      >
        <Icon name={visible ? 'eyeOff' : 'eye'} size={18} />
      </button>
    </div>
  );
}
