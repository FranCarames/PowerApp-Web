import type { UIMatch } from 'react-router';

/**
 * Lo que una ruta le pide al marco (`AppShell`, en `src/app`) en su `handle`. Por ahora, solo el ancho:
 * desde 960 px el contenido llega hasta 940 px, salvo en las pantallas con `wide`, que llegan hasta 1600.
 */
export interface ShellHandle {
  /** La pantalla aprovecha el ancho de escritorio (el editor de rutina, con la biblioteca al costado). */
  wide?: boolean;
}

/** El `handle` de las pantallas anchas. */
export const WIDE_SCREEN: ShellHandle = { wide: true };

/** Si alguna de las rutas abiertas pide el ancho completo. */
export function isWideScreen(matches: readonly UIMatch[]): boolean {
  return matches.some(
    ({ handle }) =>
      typeof handle === 'object' &&
      handle !== null &&
      (handle as ShellHandle).wide === true,
  );
}
