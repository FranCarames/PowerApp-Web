import type { MouseEvent } from 'react';
import { useLocation, useNavigate } from 'react-router';

import { cameThroughApp } from '../wikiState';

/**
 * El `onBack` de <PageHeader> para una pantalla a la que se llega desde varios lugares (la página de
 * un músculo, la ficha abierta desde ella). Si se llegó por un link de la app, "Volver" retrocede en
 * el historial y la pantalla anterior queda como estaba. Si no (link directo, recarga), devuelve
 * `undefined` y el enlace va a su destino de siempre.
 */
export function useHistoryBack() {
  const navigate = useNavigate();
  const { state } = useLocation();

  if (!cameThroughApp(state)) return undefined;

  return (event: MouseEvent<HTMLAnchorElement>) => {
    // Con Ctrl, Cmd, Shift o el botón del medio se quiere abrir el destino en otra pestaña.
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey)
      return;
    event.preventDefault();
    void navigate(-1);
  };
}
