import { useState } from 'react';

import {
  Field,
  Input,
  PasswordInput,
  SearchInput,
  Select,
  Textarea,
} from '@/shared/ui';

import { GalleryDemo } from '../GalleryDemo';
import { GallerySection } from '../GallerySection';

const EXERCISES = ['Press de banca', 'Sentadilla', 'Peso muerto', 'Dominadas'];

export function FieldsSection() {
  const [email, setEmail] = useState('');
  const emailError =
    email !== '' && !/^\S+@\S+\.\S+$/.test(email)
      ? 'Ingresá un email válido'
      : undefined;

  return (
    <GallerySection
      id="campos"
      title="Campos"
      description="Field asocia la etiqueta, la ayuda y el error con su control. Tocá un campo para ver el foco."
    >
      <GalleryDemo label="Input" layout="grid">
        <Field label="Nombre">
          <Input placeholder="Franco" autoComplete="given-name" />
        </Field>
        <Field label="Email" hint="Lo usamos para recuperar tu acceso.">
          <Input type="email" placeholder="tu@email.com" />
        </Field>
        <Field
          label="Email con validación (escribí algo inválido)"
          error={emailError}
        >
          <Input
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
        <Field label="Campo con error" error="Este campo es obligatorio">
          <Input />
        </Field>
        <Field label="Deshabilitado">
          <Input disabled defaultValue="No se puede editar" />
        </Field>
      </GalleryDemo>

      <GalleryDemo label="Contraseña" layout="grid">
        <Field label="Contraseña">
          <PasswordInput
            placeholder="Mínimo 6 caracteres"
            autoComplete="new-password"
          />
        </Field>
        <Field label="Contraseña con error" error="Mínimo 6 caracteres">
          <PasswordInput defaultValue="abc" />
        </Field>
      </GalleryDemo>

      <GalleryDemo label="Select y Textarea" layout="grid">
        <Field label="Ejercicio">
          <Select defaultValue="Press de banca">
            {EXERCISES.map((exercise) => (
              <option key={exercise}>{exercise}</option>
            ))}
          </Select>
        </Field>
        <Field label="Select con error" error="Elegí un ejercicio">
          <Select defaultValue="">
            <option value="" disabled>
              Elegí un ejercicio
            </option>
            {EXERCISES.map((exercise) => (
              <option key={exercise}>{exercise}</option>
            ))}
          </Select>
        </Field>
        <Field label="Notas del entrenador">
          <Textarea placeholder="Objetivos y observaciones" />
        </Field>
        <Field
          label="Textarea con error"
          error="Escribí al menos una indicación"
        >
          <Textarea />
        </Field>
      </GalleryDemo>

      <GalleryDemo label="Búsqueda" layout="grid">
        <SearchInput placeholder="Buscar ejercicio" />
      </GalleryDemo>
    </GallerySection>
  );
}
