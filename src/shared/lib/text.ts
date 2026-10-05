/**
 * El texto en minúsculas y sin acentos, para comparar al buscar: "Extensión" y "extension" son lo
 * mismo, como lo espera quien tipea en un teclado de celular.
 */
export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

/** Si `text` contiene lo buscado, sin distinguir mayúsculas ni acentos. Una búsqueda vacía coincide con todo. */
export function matchesSearch(text: string, search: string): boolean {
  const needle = normalizeText(search.trim());
  return needle === '' || normalizeText(text).includes(needle);
}
