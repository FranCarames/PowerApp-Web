import { Fab, useToast } from '@/shared/ui';

import styles from './UiGallery.module.css';
import { ButtonsSection } from './sections/ButtonsSection';
import { CardsSection } from './sections/CardsSection';
import { ChoiceSection } from './sections/ChoiceSection';
import { ColorsSection } from './sections/ColorsSection';
import { DataSection } from './sections/DataSection';
import { FeedbackSection } from './sections/FeedbackSection';
import { FieldsSection } from './sections/FieldsSection';
import { IconButtonsSection } from './sections/IconButtonsSection';
import { IconsSection } from './sections/IconsSection';
import { ListsSection } from './sections/ListsSection';
import { ModalsSection } from './sections/ModalsSection';
import { NotesSection } from './sections/NotesSection';
import { TypographySection } from './sections/TypographySection';

const INDEX = [
  { id: 'tipografias', label: 'Tipografías' },
  { id: 'colores', label: 'Colores' },
  { id: 'iconos', label: 'Íconos' },
  { id: 'botones', label: 'Botones' },
  { id: 'botones-icono', label: 'Botones de ícono' },
  { id: 'campos', label: 'Campos' },
  { id: 'tarjetas', label: 'Tarjetas' },
  { id: 'listas', label: 'Listas' },
  { id: 'avisos', label: 'Avisos' },
  { id: 'seleccion', label: 'Chips y segmentado' },
  { id: 'datos', label: 'Stats y progreso' },
  { id: 'feedback', label: 'Feedback' },
  { id: 'modales', label: 'Modales' },
];

/** Galería de componentes base: la ruta /dev/ui, que solo existe en desarrollo. */
export function UiGallery() {
  const toast = useToast();

  return (
    <main className={styles.page}>
      <p className={styles.eyebrow}>Solo desarrollo · /dev/ui</p>
      <h1 className={styles.title}>Componentes base</h1>
      <p className={styles.intro}>
        Todo lo de <code>shared/ui</code> y <code>shared/icons</code> en un solo
        lugar, para revisarlo en mobile y en desktop.
      </p>
      <nav aria-label="Secciones de la galería" className={styles.index}>
        {INDEX.map(({ id, label }) => (
          <a key={id} href={`#${id}`} className={styles.indexLink}>
            {label}
          </a>
        ))}
      </nav>

      <TypographySection />
      <ColorsSection />
      <IconsSection />
      <ButtonsSection />
      <IconButtonsSection />
      <FieldsSection />
      <CardsSection />
      <ListsSection />
      <NotesSection />
      <ChoiceSection />
      <DataSection />
      <FeedbackSection />
      <ModalsSection />

      <Fab
        label="Botón de acción flotante"
        onClick={() => toast.success('Tocaste el botón flotante')}
      />
    </main>
  );
}
