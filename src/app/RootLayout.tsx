import { Outlet, ScrollRestoration } from 'react-router';

/** Raíz de todas las rutas. ScrollRestoration vuelve arriba al cambiar de pantalla y recuerda el scroll al volver atrás. */
export function RootLayout() {
  return (
    <>
      <Outlet />
      <ScrollRestoration />
    </>
  );
}
