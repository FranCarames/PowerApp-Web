import type { ChangeEvent } from 'react';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';

import { maskCuil } from '@/shared/lib/format';
import { Field, Input } from '@/shared/ui';

import type { CoachDataInput } from '../schemas';

interface CoachDataFieldsProps {
  register: UseFormRegister<CoachDataInput>;
  errors: FieldErrors<CoachDataInput>;
}

/**
 * Los datos profesionales de un entrenador: email y CUIL (`coachDataSchema`). Los comparten
 * Convertir alumno (T36) y la edición del entrenador (T37). El CUIL se formatea mientras se escribe
 * (`maskCuil`) y se envía sin guiones.
 */
export function CoachDataFields({ register, errors }: CoachDataFieldsProps) {
  const cuil = register('cuil');

  // Se aplica la máscara al campo antes de que react-hook-form lo lea, para que el valor del formulario
  // y su validación vean el texto ya formateado. El cursor se devuelve a su lugar, porque asignar el
  // valor lo manda al final.
  const handleCuilChange = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const masked = maskCuil(input.value, input.selectionStart ?? undefined);
    if (masked.value !== input.value) {
      input.value = masked.value;
      input.setSelectionRange(masked.caret, masked.caret);
    }
    return cuil.onChange(event);
  };

  return (
    <>
      <Field label="Email profesional" error={errors.coach_email?.message}>
        <Input
          type="email"
          maxLength={50}
          autoComplete="off"
          placeholder="sofia.coach@gym.com"
          {...register('coach_email')}
        />
      </Field>
      <Field label="CUIL" error={errors.cuil?.message}>
        {/* Sin `maxLength`: lo pegado con espacios o guiones de más se recorta con la máscara, no antes. */}
        <Input
          inputMode="numeric"
          autoComplete="off"
          placeholder="27-12345678-4"
          {...cuil}
          onChange={handleCuilChange}
        />
      </Field>
    </>
  );
}
