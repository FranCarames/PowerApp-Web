// Cómo se arma el body de un alta o una edición con campos opcionales de texto. El DTO rechaza el
// texto vacío (`IsNotEmpty`), pero deja pasar `undefined` y `null` (`IsOptional`).

/** En un alta, un campo opcional vacío no se manda. */
export function filledValue(value: string): string | undefined {
  return value === '' ? undefined : value;
}

/**
 * En una edición, un campo opcional vacío manda `null` si ya tenía un dato (la columna lo acepta y
 * así se borra) y nada si no lo tenía. Solo sirve donde el backend asigna lo que viene
 * (`editMuscle`, `editMuscleGroup`): `editExercise` conserva el valor anterior y no deja vaciar.
 * El contrato no declara el `null`, por eso estas ediciones van con `request`.
 */
export function editedValue(
  value: string,
  saved: string | undefined,
): string | null | undefined {
  if (value !== '') return value;
  return saved ? null : undefined;
}
