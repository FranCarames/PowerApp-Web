import type { ComponentProps } from 'react';

import { Icon, type IconName } from '@/shared/icons';
import { cx } from '@/shared/lib/cx';

import buttonStyles from './Button.module.css';
import styles from './ButtonLink.module.css';

interface ButtonLinkProps extends ComponentProps<'a'> {
  variant?: 'pri' | 'sec' | 'ghost';
  /** Versión compacta, de ancho automático. */
  sm?: boolean;
  /** Ícono a la izquierda del texto. */
  icon?: IconName;
  /** Abre el link en otra pestaña, sin darle acceso a la nuestra. Es para sitios de afuera (un video). */
  external?: boolean;
}

/** Un link con la forma de un <Button>: para ir a una dirección, no para hacer algo en la pantalla. */
export function ButtonLink({
  variant = 'pri',
  sm = false,
  icon,
  external = false,
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <a
      className={cx(
        buttonStyles.btn,
        buttonStyles[variant],
        sm && buttonStyles.sm,
        styles.link,
        className,
      )}
      {...(external && { target: '_blank', rel: 'noopener noreferrer' })}
      {...rest}
    >
      {icon && <Icon name={icon} size={16} />}
      {children}
    </a>
  );
}
