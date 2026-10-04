import { Note } from '@/shared/ui';

import { GalleryDemo } from '../GalleryDemo';
import { GallerySection } from '../GallerySection';

export function NotesSection() {
  return (
    <GallerySection
      id="avisos"
      title="Avisos"
      description="Note informa (acc) o advierte (warn), como en el prototipo. Los otros tonos siguen la misma regla."
    >
      <GalleryDemo label="Tonos" layout="stack">
        <Note tone="acc" icon="mail">
          Ingresá con la contraseña temporal que enviamos a franco@email.com.
        </Note>
        <Note tone="warn" icon="key">
          Ingresaste con una contraseña temporal. Creá una nueva para terminar
          de recuperar tu cuenta.
        </Note>
        <Note tone="ok" icon="check">
          Tu pago quedó registrado.
        </Note>
        <Note tone="err" icon="alert" role="alert">
          No pudimos guardar los cambios. Intentá de nuevo.
        </Note>
        <Note tone="pri" icon="bolt">
          Tu plan arranca el lunes.
        </Note>
        <Note>Sin ícono: el texto ocupa todo el ancho.</Note>
      </GalleryDemo>
    </GallerySection>
  );
}
