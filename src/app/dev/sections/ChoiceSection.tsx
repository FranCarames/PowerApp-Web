import { useState } from 'react';

import { Chip, ChipGroup, Segmented } from '@/shared/ui';

import { GalleryDemo } from '../GalleryDemo';
import { GallerySection } from '../GallerySection';

const FILTERS = ['Todos', 'Pecho', 'Espalda', 'Pierna', 'Hombro', 'Brazo'];
const MUSCLES = ['Pectoral mayor', 'Dorsal ancho', 'Cuádriceps', 'Deltoides'];

const VIEWS = [
  { value: 'ejercicios', label: 'Ejercicios' },
  { value: 'musculos', label: 'Músculos' },
  { value: 'grupos', label: 'Grupos' },
] as const;

export function ChoiceSection() {
  const [filter, setFilter] = useState('Todos');
  const [muscles, setMuscles] = useState(['Pectoral mayor', 'Tríceps']);
  const [view, setView] =
    useState<(typeof VIEWS)[number]['value']>('ejercicios');

  function addMuscle() {
    const next = MUSCLES.find((muscle) => !muscles.includes(muscle));
    if (next) setMuscles([...muscles, next]);
  }

  return (
    <GallerySection
      id="seleccion"
      title="Chips y control segmentado"
      description="Para filtrar y para cambiar de vista. Los dos publican su estado con aria-pressed."
    >
      <GalleryDemo
        label="Chips de filtro (se desplazan en horizontal en pantallas angostas)"
        layout="stack"
      >
        <ChipGroup aria-label="Filtrar por grupo muscular">
          {FILTERS.map((name) => (
            <Chip
              key={name}
              selected={filter === name}
              onClick={() => setFilter(name)}
            >
              {name}
            </Chip>
          ))}
        </ChipGroup>
      </GalleryDemo>

      <GalleryDemo
        label="Etiquetas con ✕ (tone acc) y acción de agregar"
        layout="stack"
      >
        <ChipGroup wrap aria-label="Músculos trabajados">
          {muscles.map((name) => (
            <Chip
              key={name}
              selected
              tone="acc"
              // No es un interruptor: es un botón que quita la etiqueta.
              aria-pressed={undefined}
              aria-label={`Quitar ${name}`}
              onClick={() => setMuscles(muscles.filter((m) => m !== name))}
            >
              {name} ✕
            </Chip>
          ))}
          <Chip onClick={addMuscle}>+ Agregar</Chip>
        </ChipGroup>
      </GalleryDemo>

      <GalleryDemo label="Segmented" layout="stack">
        <Segmented
          label="Ver ejercicios, músculos o grupos"
          options={VIEWS}
          value={view}
          onChange={setView}
        />
      </GalleryDemo>
    </GallerySection>
  );
}
