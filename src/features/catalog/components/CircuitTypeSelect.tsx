import { useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import type { CircuitType, CircuitTypeRef } from '@/api/types';
import { Field, Select } from '@/shared/ui';

import { circuitTypeOptions } from '../circuitTypes';
import type { CircuitInput } from '../circuitSchema';

interface CircuitTypeSelectProps {
  /** Los tipos activos por orden alfabético, si ya llegaron. */
  actives?: CircuitType[];
  /** Mientras se piden los tipos (la primera vez). */
  loading: boolean;
  /** El tipo que el circuito tiene guardado. Sin él, es un alta. */
  saved?: CircuitTypeRef;
}

/**
 * El campo «Tipo» del editor de circuitos (CU-E-22 y CU-E-23): un `<select>` con los tipos activos y,
 * si el circuito tiene uno dado de baja, ese también, elegido y marcado («<tipo> (dado de baja)»).
 * Va controlado, porque las opciones llegan después que el valor. Mientras cargan los tipos, o en el
 * alta si no hay ninguno para elegir, queda deshabilitado; el aviso de por qué lo da
 * `CircuitTypeNotice`.
 */
export function CircuitTypeSelect({
  actives,
  loading,
  saved,
}: CircuitTypeSelectProps) {
  const {
    control,
    formState: { errors },
  } = useFormContext<CircuitInput>();
  // El que se eligió acá, por si el Admin lo da de baja mientras tanto y deja de estar entre los activos.
  const [picked, setPicked] = useState<CircuitTypeRef | null>(null);

  return (
    <Field label="Tipo" error={errors.circuit_type_id?.message}>
      <Controller
        control={control}
        name="circuit_type_id"
        render={({ field: { value, onChange, ...field } }) => {
          const options = circuitTypeOptions({
            actives,
            saved,
            picked: picked?.id === value ? picked : null,
          });
          const placeholder = loading
            ? 'Cargando tipos…'
            : actives?.length === 0 && options.length === 0
              ? 'No hay tipos activos'
              : null;

          return (
            <Select
              {...field}
              value={placeholder ? '' : value}
              disabled={placeholder !== null || options.length === 0}
              onChange={(event) => {
                const id = event.target.value;
                const type = actives?.find((candidate) => candidate.id === id);
                setPicked(type ? { id, type: type.type, active: true } : null);
                onChange(id);
              }}
            >
              {placeholder ? (
                <option value="">{placeholder}</option>
              ) : (
                <>
                  {(value === '' || options.length === 0) && (
                    <option value="">Elegí un tipo</option>
                  )}
                  {options.map(({ id, label }) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </>
              )}
            </Select>
          );
        }}
      />
    </Field>
  );
}
