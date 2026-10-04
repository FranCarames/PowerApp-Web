import { ICON_PATHS, Icon, type IconName } from '@/shared/icons';

import { GallerySection } from '../GallerySection';
import styles from './IconsSection.module.css';

// Las claves de ICON_PATHS son exactamente IconName: el cast solo recupera el tipo que Object.keys pierde.
const ICON_NAMES = Object.keys(ICON_PATHS) as IconName[];

export function IconsSection() {
  return (
    <GallerySection
      id="iconos"
      title="Íconos"
      description={`${ICON_NAMES.length} íconos. Los 33 del prototipo más eyeOff, que usa PasswordInput.`}
    >
      <div className={styles.grid}>
        {ICON_NAMES.map((name) => (
          <div key={name} className={styles.tile}>
            <Icon name={name} size={24} />
            <code className={styles.name}>{name}</code>
          </div>
        ))}
      </div>
    </GallerySection>
  );
}
