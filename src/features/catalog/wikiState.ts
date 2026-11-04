/**
 * Lo que la lista de la wiki le pasa a la ficha por el `state` de la navegación: su búsqueda y su chip
 * (`?q=…&grupo=…`), para que "Volver" deje la lista como estaba. Una ficha abierta de cero (un link
 * directo) no trae nada.
 */
export interface WikiLocationState {
  listSearch: string;
}

/** La búsqueda de la lista que viene en el `state` de la ficha, o vacía si no hay una válida. */
export function wikiListSearch(state: unknown): string {
  if (
    typeof state === 'object' &&
    state !== null &&
    'listSearch' in state &&
    typeof state.listSearch === 'string' &&
    state.listSearch.startsWith('?')
  ) {
    return state.listSearch;
  }
  return '';
}
