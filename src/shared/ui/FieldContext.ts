import { createContext, useContext } from 'react';

interface FieldContextValue {
  /** id del control: es el que referencia el <label htmlFor>. */
  id: string;
  invalid: boolean;
  /** id del mensaje (error o ayuda) que describe al control. */
  describedBy: string | undefined;
}

export const FieldContext = createContext<FieldContextValue | null>(null);

interface ControlOverrides {
  id?: string;
  invalid?: boolean;
  'aria-describedby'?: string;
}

/**
 * Datos de accesibilidad que un control toma del <Field> que lo contiene.
 * Lo que se pase por props tiene prioridad: así un control también anda suelto, fuera de un Field.
 */
export function useFieldControl({
  id,
  invalid,
  'aria-describedby': describedBy,
}: ControlOverrides) {
  const field = useContext(FieldContext);
  const isInvalid = invalid ?? field?.invalid ?? false;

  return {
    isInvalid,
    props: {
      id: id ?? field?.id,
      'aria-invalid': isInvalid || undefined,
      'aria-describedby': describedBy ?? field?.describedBy,
    },
  };
}
