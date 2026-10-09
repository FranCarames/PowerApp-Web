/**
 * Si `value` es un link http o https. Es lo único que se abre como enlace o se carga como imagen
 * cuando el dato viene del backend: un `javascript:` o un `data:` guardado como "link" no se sigue.
 */
export function isHttpUrl(value: string | null | undefined): value is string {
  if (!value) return false;
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}
