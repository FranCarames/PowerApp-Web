import { Card } from '@/shared/ui';

import { GallerySection } from '../GallerySection';
import styles from './ColorsSection.module.css';
import { Swatch } from './Swatch';

const COLOR_GROUPS = [
  {
    title: 'Fondos y bordes',
    tokens: ['--base', '--card', '--el', '--border', '--border2'],
  },
  { title: 'Marca', tokens: ['--pri', '--priL', '--acc'] },
  { title: 'Texto', tokens: ['--tp', '--ts', '--tm'] },
  { title: 'Estados', tokens: ['--ok', '--warn', '--err'] },
  {
    title: 'Estados suaves',
    tokens: ['--okS', '--warnS', '--errS', '--priS', '--accS'],
  },
];

export function ColorsSection() {
  return (
    <GallerySection
      id="colores"
      title="Colores"
      description="Los valores se leen del CSS real, así que son los de tokens.css."
    >
      {COLOR_GROUPS.map(({ title, tokens }) => (
        <Card key={title}>
          <strong className={styles.title}>{title}</strong>
          <div className={styles.swatches}>
            {tokens.map((token) => (
              <Swatch key={token} token={token} />
            ))}
          </div>
        </Card>
      ))}
    </GallerySection>
  );
}
