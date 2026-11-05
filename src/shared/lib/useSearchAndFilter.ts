import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';

import { useDebouncedValue } from './useDebouncedValue';

/** Espera entre la última tecla y el pedido al backend. */
export const SEARCH_DEBOUNCE_MS = 300;

/** El backend rechaza una búsqueda de más de 100 caracteres (`keyword` de `GetUsersQueryDto`). */
export const KEYWORD_MAX_LENGTH = 100;

/**
 * El estado de un listado con buscador y chips de filtro: el texto que se tipea, el texto que se le
 * manda al backend (con debounce y sin espacios en los bordes) y el chip elegido.
 *
 * El texto y el chip se copian a la URL (`?q=ana&<param>=<valor>`) y se leen de ahí solo al abrir
 * la pantalla: al volver del detalle de un elemento, la lista queda como estaba. Cambiarlos no agrega
 * entradas al historial. Un valor del chip que no está en `values` se ignora. Sin `values` (chips
 * que salen de los datos, como los grupos musculares) se acepta cualquier valor y quien lo usa
 * comprueba que exista.
 */
export function useSearchAndFilter<V extends string = string>(
  param: string,
  values?: readonly V[],
) {
  const navigate = useNavigate();
  const { search: urlSearch } = useLocation();

  const [filter, setFilter] = useState<V | null>(() => {
    const value = new URLSearchParams(urlSearch).get(param);
    if (!value) return null;
    if (!values) return value as V;
    return values.find((candidate) => candidate === value) ?? null;
  });
  // Lo que se tipea se ve al instante; el backend recibe el texto cuando la mano se detiene.
  const [search, setSearch] = useState(
    () => new URLSearchParams(urlSearch).get('q') ?? '',
  );
  const keyword = useDebouncedValue(search, SEARCH_DEBOUNCE_MS).trim();

  useEffect(() => {
    // Solo toca `q` y su chip: lo demás de la URL (otro filtro, como el de `useUrlFlag`) se conserva.
    const params = new URLSearchParams(urlSearch);
    if (keyword) params.set('q', keyword);
    else params.delete('q');
    if (filter) params.set(param, filter);
    else params.delete(param);
    const next = params.size > 0 ? `?${params}` : '';
    if (next !== urlSearch) navigate({ search: next }, { replace: true });
  }, [keyword, filter, param, urlSearch, navigate]);

  return { search, setSearch, keyword, filter, setFilter };
}

/**
 * Un segundo chip de un listado que ya tiene buscador y chip con `useSearchAndFilter` (el tipo de
 * circuito junto a Activos, Inactivos y Todos), con su valor en la URL (`?<param>=<valor>`). Dos
 * `useSearchAndFilter` en la misma pantalla se pisarían la búsqueda (`q`): este solo escribe su
 * parámetro. Se lee de la URL solo al abrir la pantalla, cambiarlo no agrega entradas al historial, y
 * acepta cualquier valor: quien lo usa comprueba que exista.
 */
export function useUrlParam(param: string) {
  const navigate = useNavigate();
  const { search: urlSearch } = useLocation();
  const [value, setValue] = useState<string | null>(
    () => new URLSearchParams(urlSearch).get(param) || null,
  );

  useEffect(() => {
    const params = new URLSearchParams(urlSearch);
    if (value) params.set(param, value);
    else params.delete(param);
    const next = params.size > 0 ? `?${params}` : '';
    if (next !== urlSearch) navigate({ search: next }, { replace: true });
  }, [value, param, urlSearch, navigate]);

  return [value, setValue] as const;
}

/**
 * Un interruptor de un listado (el chip "Incluir inactivas" junto a otro filtro) que queda en la URL
 * (`?<param>=1`). Como el chip de `useSearchAndFilter`, se lee de ahí solo al abrir la pantalla y
 * cambiarlo no agrega entradas al historial. Cada uno solo escribe su parámetro: conviven en la URL.
 */
export function useUrlFlag(param: string) {
  const navigate = useNavigate();
  const { search: urlSearch } = useLocation();
  const [on, setOn] = useState(
    () => new URLSearchParams(urlSearch).get(param) === '1',
  );

  useEffect(() => {
    const params = new URLSearchParams(urlSearch);
    if (on) params.set(param, '1');
    else params.delete(param);
    const next = params.size > 0 ? `?${params}` : '';
    if (next !== urlSearch) navigate({ search: next }, { replace: true });
  }, [on, param, urlSearch, navigate]);

  return [on, setOn] as const;
}
