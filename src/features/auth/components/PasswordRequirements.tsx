import { Icon } from '@/shared/icons';
import { cx } from '@/shared/lib/cx';
import { Card, VisuallyHidden } from '@/shared/ui';

import styles from './PasswordRequirements.module.css';

export interface PasswordRequirement {
  label: string;
  met: boolean;
}

/** La lista de requisitos de la contraseña nueva (.req del prototipo): cada uno se tilda al cumplirse. */
export function PasswordRequirements({
  items,
}: {
  items: PasswordRequirement[];
}) {
  return (
    <Card className={styles.card}>
      <ul className={styles.list}>
        {items.map(({ label, met }) => (
          <li key={label} className={cx(styles.req, met && styles.ok)}>
            <span className={styles.mark} aria-hidden="true">
              {met && <Icon name="check" size={11} />}
            </span>
            <VisuallyHidden>{met ? 'Cumple: ' : 'Falta: '}</VisuallyHidden>
            {label}
          </li>
        ))}
      </ul>
    </Card>
  );
}
