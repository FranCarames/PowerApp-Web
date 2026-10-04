import { useState } from 'react';

import { Icon } from '@/shared/icons';
import { Avatar, Card, Pill, useToast, type Tone } from '@/shared/ui';

import { GalleryDemo } from '../GalleryDemo';
import { GallerySection } from '../GallerySection';
import styles from './CardsSection.module.css';

const TONES: Array<{ tone: Tone; label: string }> = [
  { tone: 'pri', label: 'pri · Plan vigente' },
  { tone: 'ok', label: 'ok · Membresía activa' },
  { tone: 'warn', label: 'warn · Por vencer' },
  { tone: 'err', label: 'err · Vencida' },
  { tone: 'acc', label: 'acc · RM estimado' },
];

// Foto de ejemplo embebida, para no depender de la red.
const PHOTO =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%23393f5a'/%3E%3Ccircle cx='32' cy='26' r='12' fill='%238892A8'/%3E%3Cpath d='M8 64c4-18 16-24 24-24s20 6 24 24z' fill='%238892A8'/%3E%3C/svg%3E";
// Una imagen que no se puede decodificar: dispara onError sin pedir nada a la red.
const BROKEN_PHOTO = 'data:image/png;base64,AAAA';

export function CardsSection() {
  const toast = useToast();
  const [selected, setSelected] = useState('Lucía Méndez');

  return (
    <GallerySection
      id="tarjetas"
      title="Tarjetas, etiquetas y avatares"
      description="Card, Pill y Avatar, con los tintes y tamaños que usa el prototipo."
    >
      <GalleryDemo label="Card" layout="stack">
        <Card>Tarjeta estática: un contenedor con borde.</Card>
        <Card row>
          <Avatar name="Lucía Méndez" />
          <div className={styles.grow}>
            <div className={styles.name}>Lucía Méndez</div>
            <div className={styles.sub}>Fuerza 5×5</div>
          </div>
          <Pill tone="ok">Activo</Pill>
        </Card>
        <Card row onClick={() => toast.success('Abriste la tarjeta')}>
          <div className={styles.grow}>
            <div className={styles.name}>Tarjeta clickeable</div>
            <div className={styles.sub}>Se renderiza como botón</div>
          </div>
          <Icon name="chev" size={18} />
        </Card>
      </GalleryDemo>

      <GalleryDemo
        label="Selección (aria-pressed y borde de marca)"
        layout="stack"
      >
        {['Lucía Méndez', 'Tomás Ríos'].map((name) => (
          <Card
            key={name}
            row
            selected={selected === name}
            onClick={() => setSelected(name)}
          >
            <Avatar name={name} size={36} />
            <div className={styles.grow}>
              <div className={styles.name}>{name}</div>
              <div className={styles.sub}>Alumno activo</div>
            </div>
          </Card>
        ))}
      </GalleryDemo>

      <GalleryDemo label="Tintes (tone)" layout="grid">
        {TONES.map(({ tone, label }) => (
          <Card key={tone} tone={tone}>
            {label}
          </Card>
        ))}
      </GalleryDemo>

      <GalleryDemo label="Pill">
        <Pill tone="ok">Hecha</Pill>
        <Pill tone="pri">Hoy</Pill>
        <Pill tone="mut">Próxima</Pill>
        <Pill tone="warn">Por vencer</Pill>
        <Pill tone="err">Vencida</Pill>
        <Pill tone="acc">AMRAP · 40s</Pill>
      </GalleryDemo>

      <GalleryDemo label="Avatar">
        <Avatar name="Franco Carames" size={36} />
        <Avatar name="Franco Carames" />
        <Avatar name="Franco Carames" size={64} />
        <Avatar name="Franco Carames" size={80} />
        <Avatar name="Diego Fernández" tone="acc" />
        <Avatar name="Administrador" tone="gray" />
        <Avatar name="Con foto" src={PHOTO} size={64} />
        <Avatar name="Foto rota" src={BROKEN_PHOTO} size={64} />
      </GalleryDemo>
    </GallerySection>
  );
}
