import { useState } from 'react';

import { Button } from '@/shared/ui';

import { GalleryDemo } from '../GalleryDemo';
import { GallerySection } from '../GallerySection';

export function ButtonsSection() {
  const [saving, setSaving] = useState(false);

  function simulateSave() {
    setSaving(true);
    setTimeout(() => setSaving(false), 1500);
  }

  return (
    <GallerySection
      id="botones"
      title="Botones"
      description="Variantes del prototipo, tamaño compacto, ícono, estado de carga y foco por teclado (probá con Tab)."
    >
      <GalleryDemo label="Variantes" layout="stack">
        <Button variant="pri">Iniciar sesión</Button>
        <Button variant="sec" icon="calc">
          Calculadora
        </Button>
        <Button variant="ghost">Crear cuenta nueva</Button>
        <Button variant="danger" icon="logout">
          Cerrar sesión
        </Button>
        <Button variant="danger" solid>
          Eliminar
        </Button>
      </GalleryDemo>

      <GalleryDemo label="Compactos (sm)">
        <Button sm variant="sec">
          Registrar pago
        </Button>
        <Button sm variant="ghost">
          Editar
        </Button>
        <Button sm>Asignar</Button>
        <Button sm variant="danger">
          Quitar
        </Button>
      </GalleryDemo>

      <GalleryDemo label="Estados" layout="stack">
        <Button disabled>Deshabilitado</Button>
        <Button loading={saving} onClick={simulateSave}>
          {saving ? 'Guardando…' : 'Guardar (simula 1,5 s de espera)'}
        </Button>
        <Button variant="ghost" dashed icon="plus">
          Agregar ejercicio
        </Button>
      </GalleryDemo>
    </GallerySection>
  );
}
