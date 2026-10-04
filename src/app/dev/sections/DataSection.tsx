import { useState } from 'react';

import { FiberBar, Stat, StatGrid } from '@/shared/ui';

import { GalleryDemo } from '../GalleryDemo';
import { GallerySection } from '../GallerySection';

export function DataSection() {
  const [value, setValue] = useState(37);

  return (
    <GallerySection
      id="datos"
      title="Stats y barra de progreso"
      description="Stat muestra el valor en JetBrains Mono. FiberBar es el relleno firma de la app."
    >
      <GalleryDemo label="StatGrid" layout="stack">
        <StatGrid>
          <Stat value={4} label="ejercicios" />
          <Stat value={14} label="series" />
          <Stat value="~45" label="min" />
        </StatGrid>
        <StatGrid>
          <Stat value={24} label="Sesiones" tone="pri" />
          <Stat value="82%" label="Adherencia" tone="acc" />
          <Stat value={3} label="Meses" tone="ok" />
        </StatGrid>
        <StatGrid>
          <Stat value={7} label="Activas" tone="ok" tinted />
          <Stat value={2} label="Por vencer" tone="warn" tinted />
          <Stat value={1} label="Vencidas" tone="err" tinted />
        </StatGrid>
      </GalleryDemo>

      <GalleryDemo label="FiberBar" layout="stack">
        <FiberBar label="Progreso del plan" value={37} />
        <FiberBar label="Adherencia" value={82} thin />
        <FiberBar
          label="Adherencia de un alumno inactivo"
          value={18}
          thin
          warn
        />
        <FiberBar label="Completo" value={100} />
        <FiberBar label="Sin avance" value={0} />
      </GalleryDemo>

      <GalleryDemo
        label="Animación del relleno (arrastrá el control)"
        layout="stack"
      >
        <FiberBar label="Valor de prueba" value={value} />
        <input
          type="range"
          min={0}
          max={100}
          value={value}
          aria-label="Valor de la barra de prueba"
          onChange={(event) => setValue(Number(event.target.value))}
        />
      </GalleryDemo>
    </GallerySection>
  );
}
