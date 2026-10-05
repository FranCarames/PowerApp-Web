import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';

import { useDebouncedValue } from './useDebouncedValue';

/** Espera entre la última tecla y el pedido al backend. */
const SEARCH_DEBOUNCE_MS = 300;

/** El backend rechaza una búsqueda de más de 100 caracteres (`keyword` de `GetUsersQueryDto`). */
export const KEYWORD_MAX_LENGTH = 100;

/**
 * El estado de un listado con buscador y chips de filtro: el texto que se tipea, el texto que se le
 * manda al backend (con debounce y sin espacios en los bordes) y el chip elegido.
 *
 * El texto y el chip se copian a la URL (`?q=ana&<param>=<valor>`) y se leen de ahí solo al abrir
 * la pantalla: al volver del detalle de un elemento, la lista queda como estaba. Cambiarlos no agrega
 * entradas al historial. Un valor del chip que no está en `values` se ignora.
 */
export function useSearchAndFilter<V extends string>(
  param: string,
  values: readonly V[],
) {
  const navigate = useNavigate();
  const { search: urlSearch } = useLocation();

  const [filter, setFilter] = useState<V | null>(() => {
    const value = new URLSearchParams(urlSearch).get(param);
    return values.find((candidate) => candidate === value) ?? null;
  });
  // Lo que se tipea se ve al instante; el backend recibe el texto cuando la mano se detiene.
  const [search, setSearch] = useState(
    () => new URLSearchParams(urlSearch).get('q') ?? '',
  );
  const keyword = useDebouncedValue(search, SEARCH_DEBOUNCE_MS).trim();

  useEffect(() => {
    const params = new URLSearchParams();
    if (keyword) params.set('q', keyword);
    if (filter) params.set(param, filter);
    const next = params.size > 0 ? `?${params}` : '';
    if (next !== urlSearch) navigate({ search: next }, { replace: true });
  }, [keyword, filter, param, urlSearch, navigate]);

  return { search, setSearch, keyword, filter, setFilter };
}
