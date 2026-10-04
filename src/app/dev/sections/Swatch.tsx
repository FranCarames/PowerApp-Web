import { useState } from 'react';

import styles from './Swatch.module.css';

function readToken(token: string) {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(token)
    .trim();
}

export function Swatch({ token }: { token: string }) {
  // El valor se lee del CSS real: así la galería no duplica los tokens.
  const [value] = useState(() => readToken(token));

  return (
    <div className={styles.swatch}>
      <div className={styles.chip} style={{ background: `var(${token})` }} />
      <code className={styles.name}>{token}</code>
      <span className={styles.value}>{value}</span>
    </div>
  );
}
