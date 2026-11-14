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

/**
 * Lo que lleva en el `state` una navegación hecha desde un link de la app hacia la página de un
 * músculo o hacia una ficha abierta desde ella. Dice que la pantalla anterior está en el historial,
 * así "Volver" puede regresar a ella tal como quedó (la rutina con sus series, la ficha con su filtro).
 */
export interface InHistoryState {
  inHistory: true;
}

export const IN_HISTORY: InHistoryState = { inHistory: true };

/** Si la pantalla se abrió desde un link de la app. Un link directo o una recarga no lo traen. */
export function cameThroughApp(state: unknown): boolean {
  return (
    typeof state === 'object' &&
    state !== null &&
    'inHistory' in state &&
    state.inHistory === true
  );
}
