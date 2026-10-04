import { useState } from 'react';

import {
  Avatar,
  Button,
  Columns,
  Field,
  Input,
  IconButton,
  LinkButton,
  List,
  ListItem,
  Pill,
  SectionHeader,
  Thumb,
  Tile,
  useToast,
} from '@/shared/ui';

import { GalleryDemo } from '../GalleryDemo';
import { GallerySection } from '../GallerySection';
import styles from './ListsSection.module.css';

// Foto de ejemplo embebida, para no depender de la red.
const PHOTO =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%23393f5a'/%3E%3Cpath d='M10 50l14-18 10 12 8-8 12 14z' fill='%238892A8'/%3E%3Ccircle cx='46' cy='20' r='6' fill='%238892A8'/%3E%3C/svg%3E";
const BROKEN_PHOTO = 'data:image/png;base64,AAAA';

const STUDENTS = ['Lucía Méndez', 'Tomás Ríos', 'Sofía Paz'];

export function ListsSection() {
  const toast = useToast();
  const [selected, setSelected] = useState<string[]>(['Lucía Méndez']);

  function toggle(name: string) {
    setSelected((current) =>
      current.includes(name)
        ? current.filter((item) => item !== name)
        : [...current, name],
    );
  }

  return (
    <GallerySection
      id="listas"
      title="Listas"
      description="Las piezas que se repiten en casi todas las pantallas: títulos de sección, filas, miniaturas y grillas."
    >
      <GalleryDemo label="SectionHeader" layout="stack">
        <SectionHeader title="Registrados" aside="4 ejercicios" />
        <SectionHeader
          title="Rutinas asignadas"
          aside={<LinkButton>Ver todas</LinkButton>}
        />
      </GalleryDemo>

      <GalleryDemo label="Tile (icono o letra, con tintes) y Thumb">
        <Tile icon="trophy" />
        <Tile icon="trophy" tone="pri" />
        <Tile icon="check" tone="ok" />
        <Tile icon="wallet" tone="warn" />
        <Tile icon="alert" tone="err" />
        <Tile icon="trophy" tone="acc" />
        <Tile tone="pri">A</Tile>
        <Tile>B</Tile>
        <Tile icon="key" tone="acc" size={64} />
        <Thumb />
        <Thumb size={40} />
        <Thumb src={PHOTO} />
        <Thumb src={BROKEN_PHOTO} />
      </GalleryDemo>

      <GalleryDemo label="ListItem en dos columnas desde 960 px">
        <List columns={2}>
          <ListItem
            leading={<Tile icon="trophy" tone="acc" />}
            title="Press de banca"
            subtitle="2 Jun 2026"
            trailing={
              <>
                <span className={styles.value}>
                  85,5<span className={styles.unit}> kg</span>
                </span>
                <IconButton
                  icon="edit"
                  label="Editar RM de Press de banca"
                  variant="ghost"
                />
                <IconButton
                  icon="trash"
                  label="Eliminar RM de Press de banca"
                  variant="ghost"
                  danger
                />
              </>
            }
          />
          <ListItem
            leading={<Thumb />}
            title="Remo con barra"
            subtitle="Espalda media"
            trailing={<Pill>Compuesto</Pill>}
          />
          <ListItem
            leading={<Tile icon="user" />}
            title="Datos personales"
            subtitle="Nombre, email y teléfono"
            chevron
            onClick={() => toast.success('Abriste Datos personales')}
          />
          <ListItem
            title="Día A — Empuje"
            subtitle="Pecho · Hombro · Tríceps"
            meta="6 ejercicios · 1 circuito"
            chevron
            onClick={() => toast.success('Abriste la rutina')}
          />
          <ListItem
            leading={<Avatar name="Lucía Méndez" />}
            title="Lucía Méndez"
            subtitle="Fuerza 5×5"
            trailing={<Pill tone="ok">Activo</Pill>}
          />
          <ListItem
            tone="ok"
            leading={<Tile icon="wallet" tone="ok" />}
            title="Plan Mensual"
            subtitle="Vence el 15 Jul 2026"
          />
        </List>
      </GalleryDemo>

      <GalleryDemo label="Lista de selección (marca al final, borde y aria-pressed)">
        <List gap={8}>
          {STUDENTS.map((name) => (
            <ListItem
              key={name}
              leading={<Avatar name={name} size={36} />}
              title={name}
              subtitle="Alumno activo"
              selected={selected.includes(name)}
              onClick={() => toggle(name)}
            />
          ))}
        </List>
      </GalleryDemo>

      <GalleryDemo label="Columns (dos columnas en cualquier ancho)">
        <Columns>
          <Field label="Peso (kg)">
            <Input type="number" placeholder="Ej: 80" />
          </Field>
          <Field label="Repeticiones">
            <Input type="number" placeholder="Ej: 5" />
          </Field>
        </Columns>
        <Columns>
          <Button variant="ghost">Reiniciar</Button>
          <Button>Pausar</Button>
        </Columns>
      </GalleryDemo>
    </GallerySection>
  );
}
