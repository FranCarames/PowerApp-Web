import { Logo } from '@/shared/ui';

import styles from './BrandBlock.module.css';

/** Marca centrada que abre las pantallas de ingreso (brandBlock del prototipo). */
export function BrandBlock() {
  return (
    <div className={styles.brand}>
      <Logo className={styles.logo} />
      <h1 className={styles.wordmark}>PowerApp</h1>
      <div className={styles.tagline}>Entrená con propósito</div>
    </div>
  );
}
