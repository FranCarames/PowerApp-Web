import { Card } from '@/shared/ui';

import { GallerySection } from '../GallerySection';
import styles from './TypographySection.module.css';

const FONT_FAMILIES = [
  {
    name: 'Barlow Condensed',
    token: '--fD',
    use: 'Títulos',
    weights: [600, 700, 800],
    sample: 'Mis alumnos',
    size: 36,
  },
  {
    name: 'Inter',
    token: '--fB',
    use: 'Cuerpo',
    weights: [400, 500, 600, 700, 800],
    sample: 'Press de banca plano · 3×8 con 80 kg',
    size: 14,
  },
  {
    name: 'JetBrains Mono',
    token: '--fM',
    use: 'Datos numéricos',
    weights: [500, 700, 800],
    sample: '100,5 kg · 0123456789',
    size: 22,
  },
];

export function TypographySection() {
  return (
    <GallerySection
      id="tipografias"
      title="Tipografías"
      description="Se cargan desde Google Fonts. Cada fila usa el token de la familia y un peso."
    >
      {FONT_FAMILIES.map(({ name, token, use, weights, sample, size }) => (
        <Card key={token}>
          <div className={styles.header}>
            <strong>{name}</strong>
            <code className={styles.token}>{token}</code>
            <span className={styles.use}>{use}</span>
          </div>
          {weights.map((weight) => (
            <div key={weight} className={styles.row}>
              <span className={styles.weight}>{weight}</span>
              <span
                style={{
                  fontFamily: `var(${token})`,
                  fontWeight: weight,
                  fontSize: size,
                }}
              >
                {sample}
              </span>
            </div>
          ))}
        </Card>
      ))}
    </GallerySection>
  );
}
