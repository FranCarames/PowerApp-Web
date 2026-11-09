import { useCallback, useSyncExternalStore } from 'react';

/** El corte de escritorio: desde acá la tab bar pasa a barra lateral (`AppShell`) y las listas, a dos columnas. */
export const DESKTOP_QUERY = '(min-width: 960px)';

/**
 * Si la ventana cumple una media query, y se pone al día cuando cambia (al girar el celular o achicar
 * la ventana). Sirve cuando el ancho cambia qué se monta y no solo cómo se ve: con CSS, lo escondido
 * seguiría montado.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}
