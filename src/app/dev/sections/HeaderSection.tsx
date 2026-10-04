import { Avatar, IconButton, Logo, PageHeader } from '@/shared/ui';

import { GalleryDemo } from '../GalleryDemo';
import { GallerySection } from '../GallerySection';

export function HeaderSection() {
  return (
    <GallerySection
      id="cabecera"
      title="Marca y cabecera"
      description="El logo y la cabecera de las pantallas. PageHeader también pone el título de la pestaña del navegador: acá se desactiva para no pisar el de la galería."
    >
      <GalleryDemo label="Logo: md (pantallas de acceso) y sm (barra lateral)">
        <Logo />
        <Logo size="sm" />
      </GalleryDemo>

      <GalleryDemo
        label="PageHeader con sobretítulo y acciones (barra superior)"
        layout="stack"
      >
        <PageHeader
          eyebrow="Coach Diego"
          title="Mis alumnos"
          documentTitle={false}
          actions={
            <>
              <IconButton
                icon="wallet"
                label="Control de membresías: 3 requieren atención"
                badge={3}
              />
              <Avatar name="Diego" tone="acc" />
            </>
          }
        />
      </GalleryDemo>

      <GalleryDemo label="PageHeader con Volver" layout="stack">
        <PageHeader
          back="/dev/ui"
          eyebrow="Organización"
          title="Membresías"
          documentTitle={false}
        />
      </GalleryDemo>
    </GallerySection>
  );
}
