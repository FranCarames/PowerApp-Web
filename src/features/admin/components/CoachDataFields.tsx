import type {
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
} from 'react-hook-form';

import { formatCuil } from '@/shared/lib/format';
import { Field, Input } from '@/shared/ui';

import type { CoachDataInput } from '../schemas';

interface CoachDataFieldsProps {
  register: UseFormRegister<CoachDataInput>;
  setValue: UseFormSetValue<CoachDataInput>;
  errors: FieldErrors<CoachDataInput>;
}

/**
 * Los datos profesionales de un entrenador: email y CUIL (`coachDataSchema`). Los comparten
 * Convertir alumno (T36) y la edición del entrenador (T37). El CUIL se escribe como se quiera y, al
 * salir del campo, se muestra con la máscara; se envía sin guiones.
 */
export function CoachDataFields({
  register,
  setValue,
  errors,
}: CoachDataFieldsProps) {
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
        <Input
          inputMode="numeric"
          maxLength={13}
          autoComplete="off"
          placeholder="27-12345678-4"
          {...register('cuil', {
            onBlur: (event) =>
              setValue('cuil', formatCuil(event.target.value.trim())),
          })}
        />
      </Field>
    </>
  );
}
