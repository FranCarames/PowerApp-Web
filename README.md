# PowerApp Web

Front web de **PowerApp**, una app de gestión de gimnasio con tres roles: **Usuario** (alumno), **Entrenador** y **Admin**. Consume la API REST de PowerApp (NestJS + TypeORM + PostgreSQL), desplegada en Render.

Es mobile-first: se usa sobre todo desde el celular en el gimnasio, y en escritorio se adapta.

> **Estado:** en desarrollo. Las tareas, su orden y su estado están en [`PLAN.md`](PLAN.md). Entrega final: **20/11/2026**.

## Qué hace cada rol

| Rol | Qué puede hacer | Tabs |
|---|---|---|
| **Usuario** | Ver su plan semanal y sus rutinas, marcar series, dejar notas, registrar y consultar sus RMs, calcular RMs potenciales, consultar la wiki de ejercicios, usar el temporizador y ver su historial de pagos. | Rutina, RMs, Timer, Perfil |
| **Entrenador** | Gestionar alumnos, circuitos, rutinas y planificaciones, asignarlas a los alumnos y controlar las membresías y los pagos. | Alumnos, Planes, Rutinas, Perfil |
| **Admin** | Administrar usuarios, ejercicios, circuitos, rutinas y planificaciones (asignarlas a los alumnos es solo del Entrenador), el catálogo (músculos y grupos musculares), los tipos de membresía y los entrenadores. | Inicio, Usuarios, Ejercicios, Rutinas, Más |

Los tres roles comparten Mi cuenta (datos personales, cambio de contraseña y cerrar sesión).

## Stack

| Área | Herramienta |
|---|---|
| Lenguaje | TypeScript en modo estricto |
| Interfaz | React |
| Build | Vite |
| Tipos de la API | `openapi-typescript`, generados desde `src/api/openapi.json` |
| Mocks | MSW (Mock Service Worker) |
| Cliente HTTP | `fetch` nativo con un wrapper propio (`src/api/client.ts`) |
| Datos del servidor | TanStack Query |
| Sesión | Context de React + `localStorage` |
| Navegación | React Router |
| Formularios | React Hook Form + Zod |
| Estilos | CSS Modules + variables CSS |
| Calidad | ESLint + Prettier |

No se usan Tailwind, Redux, Zustand, axios ni librerías de componentes de UI. Cualquier dependencia fuera de esta lista se aprueba antes de agregarla.

## Primeros pasos

1. Instalá las dependencias:

   ```bash
   npm install
   ```

2. Si necesitás cambiar alguna variable, copiá `.env.example` a `.env`. Para trabajar en local no hace falta: con `VITE_API_URL` vacía, Vite hace proxy de `/api` a `http://localhost:3000`, así que no hay problemas de CORS.

3. Levantá el backend local en el puerto 3000, o apuntá `API_PROXY_TARGET` al de Render. Desde T44 no hay mocks encendidos (ver "Estado de los mocks desde T44"): la app necesita un backend y una cuenta de verdad.

4. Arrancá el servidor de desarrollo:

   ```bash
   npm run dev
   ```

5. Para comprobar que el front llega al backend, abrí `/dev/api` (existe solo en desarrollo): lista las membresías y prueba un 404 y un 401 con el mensaje que vería el usuario.

### Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción en `dist/` |
| `npm run preview` | Sirve el build localmente |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
| `npm run api:fetch` | Descarga el JSON del Swagger del backend local a `src/api/openapi.json`. La URL sale de `API_DOCS_URL` (por defecto `http://localhost:3000/docs-json`) o del primer argumento: `npm run api:fetch -- <url>`. |
| `npm run api:gen` | Genera `src/api/schema.d.ts` (los tipos) y `src/api/publicOperations.ts` (los endpoints que no piden token) desde `src/api/openapi.json` |

Antes de dar una tarea por terminada, `typecheck`, `lint` y `build` tienen que pasar sin errores.

### Variables de entorno

| Variable | Uso |
|---|---|
| `VITE_API_URL` | Origen del backend, sin `/api/v1`. En Render: `https://powerapp-backend.onrender.com`. En local queda vacía. |
| `VITE_USE_MOCKS` | `true` activa MSW para los endpoints marcados como mock en `src/mocks/registry.ts`. El resto va al backend real. Desde T44 el registry está vacío, así que con `true` MSW no se inicia: no hace falta definirla. |
| `API_PROXY_TARGET` | Solo del servidor de desarrollo (no llega al navegador). A dónde reenvía Vite las requests a `/api`. Por defecto, `http://localhost:3000`. |

## Backend y mocks

El backend lo desarrolla Fran por separado y **este repo nunca lo modifica**. Lo que todavía no está implementado o no tiene contrato se resuelve así:

- **Contrato existente, implementación pendiente:** el front usa mocks con MSW hasta que el backend lo implemente. Después se apagan en `src/mocks/registry.ts`.
- **Sin contrato:** los tipos provisionales viven en `src/api/pending.ts`, marcados con `// PENDIENTE-CONTRATO: <id> <CU>`. Cuando el contrato aparece en `openapi.json`, se borran, se regeneran los tipos y se ajusta el código.
- **Arranque en frío:** el backend corre en el free tier de Render y se duerme. Si una request tarda más de 4 segundos, el front muestra "Despertando el servidor, puede tardar un poco…".

### Estado de los mocks desde T44

Desde el 24/10/2026 (T44) todos los endpoints que usa el front están en el backend de Render, así que **no hay ningún mock** y MSW no responde nada. El registry (`src/mocks/registry.ts`) y `src/mocks/handlers/index.ts` están vacíos: los handlers y las fixtures que había se borraron (T44b) y siguen en el historial de git.

- **Las cuentas de demo dejaron de existir.** `POST /users/login` va al backend, que no las conoce, y su token falso se rechaza con 401 (que cierra la sesión). Para recorrer la app hace falta una cuenta real.
- **Con el registry vacío, `startMocks` no registra el service worker** y avisa por consola. `VITE_USE_MOCKS` ya no hace falta: en Render se eliminó la variable y, sin ella, el build no incluye MSW ni `mockServiceWorker.js`.
- **Lo que queda de `src/mocks/` es el andamiaje**, para el próximo mock que haga falta: `registry.ts`, `browser.ts`, `endpoint.ts` (`mockEndpoint` y `mockPendingEndpoint`) y `responses.ts`. La fixture y el handler se crean con el mock (ver abajo).
- **Probar sin credenciales:** un `.env.<modo>` con `API_PROXY_TARGET=https://powerapp-backend.onrender.com` y `npm run dev -- --mode <modo>` manda `/api` a Render sin pasar por CORS. Sirve para los endpoints públicos (ejercicios, músculos y membresías: la wiki, el catálogo y los ejercicios del Admin); el resto pide token. Para el resto, el doble local del contrato (`.claude/fake-backend.cjs`, que no se versiona) responde con las formas del backend.

### Cómo funcionan los mocks

Con `VITE_USE_MOCKS=true`, `main.tsx` arranca MSW (`src/mocks/browser.ts`) antes del primer render. MSW registra el service worker `public/mockServiceWorker.js`, que responde solo los endpoints marcados `mock: true` en el registry (si no hay ninguno, no se registra). Todo lo demás sigue su camino al backend real, con la misma URL base (`VITE_API_URL`, o el proxy de Vite si está vacía).

| Archivo | Qué es |
|---|---|
| `src/mocks/registry.ts` | Qué endpoints se mockean: método y path del contrato (si no existen en `openapi.json`, no compila) y `mock: true \| false`. Lo que no figura es real. |
| `src/mocks/handlers/<dominio>.ts` | (Hoy solo está `index.ts`, con la lista vacía.) Los mocks de cada dominio, con `mockEndpoint(método, path, resolver)`. El resolver recibe el body del request y los parámetros de ruta tipados con el contrato, y el compilador exige que devuelva lo que el contrato declara. |
| `src/mocks/fixtures/` | (No existe hoy.) Datos de ejemplo en español, tipados con los tipos generados. |
| `src/mocks/responses.ts` | Los errores con los dos formatos del backend (`serviceError`: `{ error }`; `guardError`: `{ statusCode, message, error }`), la respuesta vacía y `authTokenHeaders`, el header `Authorization` con el que el login manda el token. |
| `src/mocks/endpoint.ts` | `mockEndpoint` y `mockPendingEndpoint`. |

- **Sumar un mock:** fixture en `fixtures/`, handler en `handlers/<dominio>.ts` (y en `handlers/index.ts`) y la entrada con `mock: true` en el registry. Si el registry y los handlers no coinciden, la consola avisa al arrancar.
- **Un endpoint sin contrato** (`PENDIENTE-CONTRATO`) se mockea con `mockPendingEndpoint` y una entrada con `pending: '<id>'` (el de la dependencia del PLAN) en el registry. Sus tipos van en `src/api/pending.ts`.
- **Apagar un mock** cuando el backend implementa el endpoint: `mock: false` en el registry. Cuando ya no hace falta, se borran su entrada, su handler y su fixture, como hizo T44b con todos.
- **Bajar el contrato de Render:** `npm run api:fetch -- https://powerapp-backend.onrender.com/docs-json` y después `npm run api:gen`. Sin argumento usa `API_DOCS_URL` o el backend local. El 23/10 se incorporaron las rutinas del alumno (`GET /routine/home/{userId}`, los detalles de una rutina individual y de una sesión del plan), marcar y desmarcar un ejercicio, la rutina puntual, el historial y las planificaciones de un alumno: sus alias están en `src/api/types.ts` y `pending.ts` ya no tiene ninguno de B1 a B9.
- **Demora:** cada mock responde después de 100 a 400 ms, como un backend de verdad, para que se vean los estados de carga.
- **CORS:** los mocks no lo reproducen. La respuesta sale del service worker, así que el navegador deja leer `Authorization` aunque el backend real todavía no lo exponga (C1 de `PLAN.md`).
- **La variable se lee al compilar** y al arrancar `npm run dev`. Con `VITE_USE_MOCKS=false` (o sin definirla), el build no incluye MSW ni `mockServiceWorker.js`. Con `true` van los dos en `dist`.
- **`public/mockServiceWorker.js`** lo genera MSW y no se edita. Al actualizar `msw`, se regenera con `npx msw init` (el directorio ya está guardado en `package.json`).
- **MSW 3** pide Node 22.12 o más.

Las dependencias abiertas con el backend (B1 a B9, C1 a C3 y V1 a V9) están detalladas en la sección 4 de [`PLAN.md`](PLAN.md).

## Sesión, guards y arranque en frío

- **La sesión** (token y usuario) vive en `src/features/auth/sessionStore.ts`: en memoria y en `localStorage` (clave `powerapp.session`), que se lee una sola vez, al cargar la página. `useAuth()` la expone.
- **Cierre automático:** un 401 de guard en un request que llevaba token, o un 403 con "La cuenta está deshabilitada.", cierran la sesión, vacían el caché de TanStack Query y muestran un aviso; los guards llevan a `/login`. El 403 de "Permisos insuficientes" no la cierra, ni tampoco un 401 de negocio: el de un service (`{ error }`, sin `statusCode`), como "La contraseña actual es incorrecta" al cambiar la contraseña. Lo decide `isSessionExpiredError` (`src/api/errors.ts`), y ante un cuerpo que no reconoce toma el 401 como sesión muerta. Si la sesión cambió mientras el request estaba en vuelo (otro login, un cierre), su error no toca la sesión nueva.
- **Guards:** `RequireRole` (cada zona exige su rol; quien tiene otro vuelve a su inicio), `RequireSession` (`/cambiar-contrasena`), `GuestRoute` (login, registro y recuperar: con sesión abierta llevan al inicio del rol, porque CU-U-01, CU-U-02 y CU-U-04 piden que no haya sesión) y `PublicRoute` (las direcciones que no existen, que se ven con o sin sesión).
- **Cambio de contraseña pendiente:** `session.passwordChangeRequired`, que marca el login (el campo `password_change_required` de la respuesta, B9). Con eso la única ruta permitida es `/cambiar-contrasena`, incluso después de recargar. `completePasswordChange()` libera el guard.
- **Arranque en frío:** si un request pasa de 4 segundos (`COLD_START_HINT_MS`, en `src/api/coldStart.ts`) sin que el backend conteste, aparece arriba "Despertando el servidor, puede tardar un poco…", sin cortar el request. Se va cuando el backend contesta (con lo que sea, menos 502, 503 o 504) o 3 segundos después del último request que falló sin respuesta, para que no parpadee mientras TanStack Query reintenta.
- **Para probarlo en desarrollo**, `/dev/api` tiene un probe que manda el token de la sesión a un endpoint protegido (con un token falso da 401 y cierra la sesión) y otro de respuesta lenta, que pide `/__dev/slow` (lo sirve Vite, solo en desarrollo, y anda solo con `VITE_API_URL` vacía).

## Navegación por rol

- **Dónde está:** `src/app/AppShell/navigation.ts`. `TAB_BAR` son las entradas de la tab bar de mobile y `SIDEBAR` los bloques de la barra lateral de desktop (desde 960 px), cada rol con las suyas. `Sidebar.tsx` y `TabBar.tsx` solo las dibujan.
- **Entrada marcada:** la de la ruta o la de cualquiera de sus `also` (incluido lo que cuelga de ella, `/c/alumnos/12`). En la barra lateral puede haber una por bloque, y la tab bar marca una sola (`activeTabOf`).
- **Entrenador:** la barra lateral tiene Membresías aparte, bajo "Organización". En mobile se entra desde el botón de la barra superior de Mis alumnos, y mientras tanto la tab Alumnos queda marcada.
- **Admin:** en desktop, tres bloques: Inicio, Usuarios y Entrenadores; "Entrenamiento" (Ejercicios, Circuitos, Rutinas y Planificaciones); y "Configuración" (Catálogo, Membresías y Perfil). En mobile, la tab bar tiene Inicio, Usuarios, Ejercicios, Rutinas y **Más** (`/a/mas`), una pantalla con los accesos que no entran: Planificaciones, Circuitos, Entrenadores, Catálogo, Membresías y Mi cuenta. Más es la entrada `fallback`: queda marcada en toda pantalla que no pertenece a otra tab, incluida Mi cuenta.
- **`SectionPlaceholder`** (`shared/ui`) ya no cubre ninguna sección: Rutinas y Planificaciones son pantallas de verdad para el Admin (T21 a T24, ver "Rutinas del Admin", "Editor de rutina del Admin", "Planificaciones del Admin" y "Editor de planificación del Admin") y para el Entrenador (T49, ver "Rutinas y planificaciones del Entrenador"). Solo lo usan los dos placeholders de asignar del Entrenador, `/c/planes/:id/asignar` (hasta T41) y `/c/rutinas/:id/asignar` (hasta T42): con él se avisa que "todavía no está disponible", con un "Volver" al editor.
- **Pantallas temporales:** las rutas del Entrenador y del Usuario que todavía no tienen su tarea abren "Pantalla en construcción" con un comentario `TEMPORAL (Txx)`, para que ningún acceso caiga en "Página no encontrada". Las del Admin ya están todas.

## Panel del Admin

- **Pantalla** (`/a/inicio`, `src/features/admin/pages/DashboardPage.tsx`): cuatro tarjetas con cuántos hay de lo principal, cada una con un acceso a su sección, y "Gestión", con los accesos a Planificaciones, Entrenadores, Músculos, Grupos musculares y Membresías.
- **Números** (`useDashboardCounts`, seis queries independientes): Usuarios, el `total` de `GET /users/all` (todos los roles); Ejercicios, `GET /exercise/all`; Circuitos activos, `GET /routine/circuit/all`; Rutinas, `GET /routine/all`; y de apoyo, los planes sistémicos de `GET /planification/all` y los entrenadores con el registro de Coach activo (`Coach.active`) de `GET /coach/all`, que baja `delete_coach` y no `set-active`. Sin `include_inactive` el backend deja afuera lo dado de baja, así que los circuitos, rutinas y planes son los vigentes. Rutinas lleva al listado (T21) y Planificaciones, al suyo (T23).
- **Catálogo:** "Músculos" y "Grupos musculares" abren `/a/catalogo` con `?seccion=musculos` o `?seccion=grupos`, para elegir el segmento.
- **Si algo no carga:** esa tarjeta muestra "–", el dato de apoyo vuelve al texto de la sección y aparece un aviso con "Reintentar", que pide solo lo que falló. Mientras carga, el número es un bloque gris.

## Usuarios del Admin

- **Pantalla** (`/a/usuarios`, `src/features/admin/pages/UsersPage.tsx`): los casos de uso CU-E-01 a CU-E-03 vistos desde el Admin. Contadores, buscador, chips y el listado paginado de `GET /users/all`. Tocar un usuario abre su detalle.
- **Contadores y chips:** Alumnos (`role=user`), Entrenadores (`role=coach`) e Inactivos (`active=false`, de todos los roles), con el `total` de cada uno; los chips son Todos, Alumnos, Entrenadores e Inactivos. Todos incluye las cuentas de admin. La búsqueda (nombre, apellido o email, con debounce) y el chip quedan en la URL (`?q=…&filtro=alumnos`), como en Mis alumnos.
- **Fila:** avatar (gris si la cuenta está inactiva, violeta si es entrenador), nombre, email, el rol y, si la cuenta está dada de baja, "Inactivo" y la fila apagada. En los alumnos, el email lleva "· membresía activa", "por vencer" o "vencida". Eso sale de `GET /membership/status/users` (cuatro requests, uno por estado, no uno por alumno); si no cargan, la fila no lo dice.
- **Detalle** (modal): el alumno, su email, su membresía (la del último pago) y su planificación vigente hoy: la primera asignación activa de `GET /planification/user/{userId}` (`useUserPlanifications`, en `features/account/hooks`) cuyas fechas incluyen el día de hoy. Si el alumno no tiene ninguna vigente, o la consulta falla, esa fila no aparece. Muestra el nombre del plan: desde el contrato del 23/10 la asignación ya no trae el tipo. El entrenador, su email profesional y su CUIL (`GET /coach/get/{id}`); el admin, su email.
- **Acciones:** "Convertir en entrenador" (alumno activo) abre `/a/convertir?alumno=<id>` (ver "Convertir alumno en entrenador del Admin"). "Editar datos", en el detalle de un entrenador, abre el modal de edición de Entrenadores. "Desactivar cuenta" pide confirmación (es una baja lógica: la cuenta no puede ingresar, pero se conservan sus datos) y "Reactivar cuenta" no. No se ofrece desactivar a un admin ni a la propia cuenta. Después de cada cambio se piden de nuevo los listados y los contadores, también los de Mis alumnos.
- **Compartido con Mis alumnos:** los hooks de datos de usuarios (`useUsers`, `useUserCount`, `useSetUserActive`...) viven en `features/account/hooks`; el listado paginado, en `features/account/components/UserList.tsx`; y la búsqueda con chip en la URL, en `shared/lib/useSearchAndFilter.ts`.

## Ejercicios del Admin

- **Pantalla** (`/a/ejercicios`, `src/features/admin/pages/ExercisesPage.tsx`): el catálogo de ejercicios (CU-A-01 a CU-A-06). Buscador por nombre (sin mayúsculas ni acentos), chips por grupo muscular, y el botón flotante "Crear ejercicio". La búsqueda y el grupo quedan en la URL (`?q=…&grupo=<id>`).
- **Fila:** miniatura (la `preview_image`, o un ícono), nombre, los músculos en una línea y los botones Editar y Eliminar. Un ejercicio aparece en todos los grupos a los que pertenecen sus músculos.
- **Editor** (`/a/ejercicios/nuevo` y `/a/ejercicios/:id`, `ExerciseForm`): nombre, descripción, músculos como chips (✕ quita; "+ Agregar" abre un modal con los que faltan, por grupo), tips de seguridad y de activación, y tres links: video, imagen de vista previa e imagen de fondo (no hay endpoint de subida). Agregar y quitar músculos es mandar la lista completa en `exercised_muscles_ids`. Un nombre repetido es un `409` en el alta y en la edición, y el formulario lo avisa.
- **Datos opcionales:** el backend no deja vaciar un dato ya cargado (rechaza el texto vacío y, si el campo no viene, conserva el anterior), así que el formulario no lo permite y lo avisa.
- **Eliminar:** pide confirmación y avisa que un ejercicio en circuitos, con RMs registrados o que ya se entrenó no se puede eliminar. En esos casos el backend no toca nada y responde un `409` con el motivo en `error`; el front compara ese texto y muestra un aviso por cada uno (en circuitos, ya se entrenó con él, hay alumnos con RMs). Un `409` con otro texto da "No se puede eliminar el ejercicio porque está en uso", y un `500` es una falla del servidor y cae en el aviso por defecto. El texto del servidor nunca se muestra. El borrado de músculos y de grupos sigue con el `500` genérico (V7).
- **Cruce con los grupos:** `useExerciseCatalog` (`src/features/catalog/hooks`) junta `GET /exercise/all`, que trae los músculos de cada ejercicio, con `GET /muscles/mg/all`, que trae los de cada grupo. Ninguno de los dos campos está en el Swagger (V9): sus tipos están en `pending.ts`. Lo reutiliza la wiki del alumno (T28).

## Catálogo del Admin: músculos

- **Pantalla** (`/a/catalogo`, `src/features/admin/pages/CatalogPage.tsx`): los segmentos Músculos y Grupos musculares (`?seccion=musculos` o `?seccion=grupos`, que son los accesos del panel). Hay un solo buscador para los dos (`?q=…`).
- **Músculos** (CU-A-07 a CU-A-10, `MusclesSection`): lista con el ícono del color de su grupo, el nombre y el grupo; buscador por nombre sin acentos; botón flotante "Crear músculo"; Editar y Eliminar en cada fila.
- **Modal de alta y edición:** nombre, grupo muscular, y opcionales la descripción, una imagen y una vista previa (links: no hay endpoint de subida). Al editar, vaciar un dato que ya tenía valor manda `null` para borrarlo.
- **Eliminar:** pide confirmación y dice cuántos ejercicios lo usan. El backend no rechaza un músculo en uso: lo borra y lo quita de los ejercicios (cascada).
- **Datos:** `GET /muscles/all` (con el grupo anidado, distinto del contrato: V9) y `GET /muscles/mg/all` para el selector, más `POST /muscles/create`, `POST /muscles/edit/{id}` y `DELETE /muscles/{id}`.

## Catálogo del Admin: grupos musculares

- **Segmento** (`/a/catalogo?seccion=grupos`, `GroupsSection`): los casos de uso CU-A-11 a CU-A-15. La lista comparte el buscador con Músculos y muestra, por grupo, el ícono con el color del grupo, el nombre y cuántos músculos tiene. Botón flotante "Crear grupo muscular", y Editar y Eliminar en cada fila.
- **Detalle:** tocar un grupo abre un modal con sus músculos (CU-A-12). Salen de `GET /muscles/mg/all`, que trae los músculos de cada grupo (V9): no hace falta pedir cada grupo.
- **Modal de alta y edición:** nombre y, opcionales, dos links (imagen y vista previa). Al editar, vaciar un link que ya tenía valor manda `null` para borrarlo.
- **Eliminar:** el backend rechaza un grupo con músculos (con un `500` sin motivo), así que si el grupo tiene músculos el front no pide confirmación: explica que hay que moverlos o eliminarlos primero. Uno sin músculos pide confirmación.

## Tipos de membresía del Admin

- **Pantalla** (`/a/membresias`, `src/features/admin/pages/MembershipTypesPage.tsx`): los casos de uso CU-A-20 a CU-A-23. Tarjetas con el nombre, la duración, cuántos alumnos tiene cada tipo y el precio en pesos; botón flotante "Crear membresía".
- **Activos e inactivos:** `GET /membership/all` trae todos los tipos. Los dados de baja se ven apagados, con "Inactiva", y en lugar de Eliminar tienen Reactivar (sin confirmación). Van después de los activos, y cada grupo de menor a mayor duración.
- **Alumnos por tipo:** salen de `GET /membership/type/users` (sin schema en el contrato: V1, tipado en `pending.ts`), que trae a todos los alumnos agrupados por el tipo de su último pago. Se pide una vez; si falla, las tarjetas no dicen la cantidad.
- **Modal de alta y edición:** nombre, precio (mayor a cero, hasta dos decimales) y duración (días enteros). Al editar, los cambios valen para los pagos nuevos: los ya registrados guardan su propia copia. El backend rechaza una duración que ya tiene otro tipo (400, en el alta y en la edición) y un nombre repetido (409), y el modal avisa cada caso.
- **Eliminar:** es una baja lógica (`POST /membership/set-active/{id}`), con confirmación que lo aclara y dice que se puede reactivar.

## Entrenadores del Admin

- **Pantalla** (`/a/entrenadores`, `src/features/admin/pages/CoachesPage.tsx`): los casos de uso CU-A-16 y CU-A-19. El botón "Convertir alumno en entrenador" (lleva a `/a/convertir`, ver más abajo) y el listado: avatar, nombre, email profesional y "Activo" o "Inactivo", y el botón de Eliminar. No dice "N alumnos" como el prototipo, porque no hay vínculo entrenador-alumno. Editar abre un modal (ver más abajo); la fila de un usuario con el rol y sin registro de Coach no tiene el botón, porque no hay nada que editar.
- **Datos (V3):** `GET /coach/all` (público) trae solo el `Coach`, sin nombre, y `GET /users/all` no anida el coach. El listado cruza por id los usuarios con `role=coach` (todas las páginas, de 100 en 100) con `GET /coach/all`: son dos requests y, si falla uno, "Reintentar" repite solo ese (`useCoaches`). Un usuario con el rol pero sin registro de Coach (un alta que falló a la mitad) aparece con "Sin email profesional".
- **Estado:** "Inactivo" es una cuenta dada de baja (`User.active`, desde Usuarios) o un `Coach` inactivo. Los inactivos van al final y el resto por nombre.
- **Eliminar (CU-A-19):** `POST /coach/delete_coach/{id}` es una baja lógica del `Coach` (`active: false`) y, además, le devuelve a su usuario el rol `user`: deja de ser entrenador y vuelve a ser alumno, con la cuenta y los datos intactos (no toca `User.active`). Por eso sale de este listado y aparece en Alumnos; el panel y los contadores de Usuarios se actualizan. La confirmación lo aclara y dice que se lo puede volver a convertir. Para reactivarlo se lo convierte de nuevo (T36): `promote_user` reactiva su `Coach` anterior y pisa el email y el CUIL.
- **Sin rechazo por integridad (V7):** el backend no revisa dependencias ni borra filas, así que no hay un rechazo como en ejercicios, músculos o grupos. Los errores posibles son un 404 (el usuario o su `Coach` no existen) y un 500 genérico: se muestran con un aviso.
- **Editar (CU-A-18):** el botón de la fila y "Editar datos" en el detalle de un entrenador en Usuarios abren un modal (`CoachEditModal`) con el email profesional y el CUIL, los mismos campos y la misma máscara que Convertir (`coachDataSchema`, `CoachDataFields`), precargados con `GET /coach/get/{id}`. No se edita el nombre ni la cuenta: son del usuario, y CU-A-18 los deja fuera (el prototipo edita nombre y email). Avisa de un email que ya usa otro entrenador antes de mandarlo y, sin cambios, cierra sin pedir nada. **Se guarda con `POST /coach/promote_user`** (`{ user_id, coach_email, cuil }`, tipado con `PromoteCoachDto`), el mismo endpoint del alta: el backend no tiene un edit propio ni lo va a tener (B8). Con un entrenador que ya lo es, le cambia el email y el CUIL y deja lo demás igual. El backend todavía no es transaccional ni responde 409 por un email o un CUIL repetidos: un email que ya usa otro entrenador cae en un 500 sin motivo, y el modal lo muestra con un aviso que no afirma la causa. Por eso el aviso previo con `GET /coach/all` sigue.

## Convertir alumno en entrenador del Admin

- **Pantalla** (`/a/convertir`, `src/features/admin/pages/ConvertPage.tsx`): el caso de uso CU-A-17. El buscador y la lista de alumnos activos (`GET /users/all?role=user&active=true`, de a 20 con "Cargar más"), y debajo "Se convierte a …", el email profesional, el CUIL y el botón "Convertir en entrenador", apagado hasta elegir a alguien. Al terminar vuelve a Entrenadores con un aviso.
- **Elegido desde Usuarios:** `?alumno=<id>` (`GET /users/get/{id}`) deja al alumno elegido. Si no se lo puede convertir (ya es entrenador, es admin, tiene la cuenta inactiva o no existe), un aviso lo dice y no se elige.
- **Datos profesionales** (`coachDataSchema` y `CoachDataFields`, que reutiliza la edición de T37): el email (hasta 50 caracteres, se manda en minúsculas) y el CUIL, que se escribe con o sin guiones, se muestra con la máscara `27-12345678-4` al salir del campo y se envía de 11 dígitos sin guiones.
- **`POST /coach/promote_user`:** solo el Admin. Si el alumno ya fue entrenador, reactiva su registro y le pisa el email y el CUIL: el formulario arranca con los que tenía y un aviso lo explica. Es la forma de reactivar a un entrenador eliminado.
- **Email repetido:** el email profesional es único y el backend cambia el rol antes de guardar los datos, así que un repetido da un 500 que deja a la cuenta con el rol y sin datos. Por eso, antes de mandar, se compara con `GET /coach/all` y se avisa sin llamar al backend. Si igual falla, el aviso manda a revisar Entrenadores, el alumno sigue elegido y se puede reintentar con otro email.

## Circuitos del Admin

- **Pantalla** (`/a/circuitos`, `src/features/admin/pages/CircuitsPage.tsx`, que monta `CircuitList`, de `src/features/catalog/components`, compartido con el Entrenador): el caso de uso CU-E-21. El aviso de que un circuito se usa en varias rutinas y los cambios valen para todas, el buscador (por nombre, sin acentos), los chips Activos, Inactivos y Todos y las tarjetas de a dos columnas desde 960 px. Un botón flotante abre `/a/circuitos/nuevo`. La búsqueda y el chip quedan en la URL (`?q=…&filtro=inactivos`).
- **Tarjeta** (`CircuitCard`): el nombre, el tipo y cuántos ejercicios tiene, en cuántas rutinas se usa (píldora "N rutinas") y los nombres de sus ejercicios, en orden. Un circuito dado de baja se ve apagado, con "Inactivo". Tocarla abre su editor (`/a/circuitos/:id`, ver más abajo), donde se lo da de baja o se lo reactiva. No muestra las series (como el prototipo) porque `all-plus` no las trae.
- **Datos:** `GET /routine/circuit/all-plus?include_inactive=true` (`useCircuits`, en `src/features/catalog/hooks`): una sola lista con los dados de baja incluidos, y los chips la filtran sin volver a pedirla. **En cuántas rutinas se usa** cada circuito no lo devuelve ningún endpoint: `useCircuitUsage` lo calcula con `GET /routine/all-plus` (solo las rutinas vigentes, y una rutina que repite el circuito cuenta una vez). Si ese pedido falla, las tarjetas no dicen la cantidad.
- **Sin mocks (6/10):** `GET /routine/circuit/all-plus` y `GET /routine/all-plus` van al backend real, que ya tiene los circuitos completos y probados.

## Editor de circuito del Admin

- **Pantalla** (`/a/circuitos/nuevo` y `/a/circuitos/:id`, `src/features/admin/pages/CircuitEditorPage.tsx`, que monta `CircuitEditor`, de `src/features/catalog/components`, compartido con el Entrenador): los casos de uso CU-E-22, CU-E-23 y CU-E-24. Nombre, tipo y descripción, los ejercicios en orden y, al editar, Duplicar y Desactivar o Reactivar. Guardar vuelve a la lista.
- **Ejercicios y series:** cada ejercicio se agrega con un selector (buscador por nombre y solo los que faltan: no se repiten) y se sube, baja o quita. Tiene su nota del entrenador y sus **bloques de series**, con todos los campos a la vista: series y repeticiones, peso, % del RM, intensidad (RPE o RIR, uno u otro), AMRAP con su tiempo y RM. Una fila es un bloque de series iguales (3 series de 8 repeticiones es un bloque) y se resume en una línea ("3×8 · 80 kg · RPE 7"). Las reglas son las de los DTOs: un RM exige una sola serie, el tiempo solo vale con AMRAP, y con AMRAP las repeticiones son el objetivo (1 es "sin objetivo").
- **Datos:** el detalle sale de `GET /routine/circuit/{id}` (`useCircuit`; el contrato declara el `exercise` de cada ejercicio como un objeto vacío, V2: tipo provisional en `pending.ts`). Alta y edición mandan el circuito completo (`POST /routine/circuit/create` y `edit/{id}`): el backend compara los ejercicios con los guardados y pisa la cabecera, así que lo que se omite (una descripción, una nota) se borra. Editar un circuito cambia todas las rutinas que lo usan; si lo usa más de una, un aviso las nombra y sugiere duplicarlo.
- **Duplicar, Desactivar y Reactivar:** Duplicar crea una copia de la versión guardada con "(copia)" y pasa a editarla. Desactivar (`POST /routine/circuit/set-active/{id}`) es una baja lógica, con confirmación: las rutinas que lo usan lo conservan. Un circuito dado de baja no se edita (el backend lo rechaza): sus campos se apagan hasta reactivarlo, y Reactivar no pide confirmación.
- **Sin mocks (6/10):** el detalle, el alta, la edición y la baja o reactivación van al backend real.
- **Desde una rutina (T22):** si el editor se abrió desde el editor de rutina (Editar un circuito o Nuevo circuito), "Volver", Guardar y Desactivar regresan a ella. Un circuito nuevo se suma a la rutina y Duplicar deja la copia en el lugar del original en ella. Está explicado en "Editor de rutina del Admin".

## Circuitos del Entrenador

- **Acceso:** el tab Rutinas del Entrenador tiene dos segmentos, Rutinas y Circuitos (`RoutinesSegments`). Cada uno es una ruta: `/c/rutinas` y `/c/circuitos`, y el editor cuelga de la segunda (`/c/circuitos/nuevo` y `/c/circuitos/:id`). La tab queda marcada en todas.
- **Listado y editor:** son los mismos del Admin (ver "Circuitos del Admin" y "Editor de circuito del Admin"), que viven en `src/features/catalog/components` (`CircuitList` y `CircuitEditor`, con `CircuitCard`, `CircuitForm`, `CircuitExerciseCard`, `CircuitSetFields` y `ExercisePickerModal`). Cada rol los monta con su `basePath` (`/a/circuitos` o `/c/circuitos`): de ahí cuelga el editor y a ahí vuelven Guardar, Desactivar y "Volver". Sus páginas son `src/features/coach/pages/CircuitsPage.tsx` y `CircuitEditorPage.tsx`.
- **Rutinas y Planes:** el segmento Rutinas (`/c/rutinas`) y `/c/planes` son pantallas de verdad desde T49 (ver "Rutinas y planificaciones del Entrenador").
- **Sin mocks:** los endpoints son los mismos del Admin y van al backend real.

## Rutinas y planificaciones del Entrenador

- **Pantallas** (`src/features/coach/pages`): `PlansPage` (`/c/planes`), `PlanEditorPage` (`/c/planes/nuevo` y `/c/planes/:id`), `RoutinesPage` (`/c/rutinas`, con los segmentos Rutinas | Circuitos de `RoutinesSegments`) y `RoutineEditorPage` (`/c/rutinas/nuevo` y `/c/rutinas/:id`). Son envoltorios finos de los componentes compartidos con el Admin, que viven en `src/features/catalog/components`: `PlanList`, `PlanEditor`, `RoutineList` y `RoutineEditor`. El Entrenador los monta con su `basePath` (`/c/planes` o `/c/rutinas`) y, el de rutinas, con `circuitsPath` `/c/circuitos`. Los casos de uso, los datos, los estados y los errores son los de las secciones del Admin ("Rutinas del Admin", "Editor de rutina del Admin", "Planificaciones del Admin" y "Editor de planificación del Admin"); no hay mocks.
- **Tabs:** Planes queda marcada en `/c/planes` y todo lo que cuelga de ahí; Rutinas, en `/c/rutinas`, lo que cuelga de ahí y `/c/circuitos…`. Un circuito que se edita o se crea desde una rutina vuelve a `/c/rutinas/:id` con lo escrito (`routineDraft`, ver "Editor de rutina del Admin").
- **Lo propio del Entrenador es asignar a alumnos** (el Admin no: el backend le responde 403). Los dos botones son opcionales (`onAssign`) en los componentes compartidos y solo el Entrenador los pasa:
  - **"Asignar" en cada planificación vigente** (`PlanList` → `PlanCard`), a la derecha de "2 de 3 rutinas". Una dada de baja no lo muestra. La tarjeta es un contenedor con un botón que abre el editor y se estira sobre toda ella (`::after`), porque "Asignar" no puede ir dentro de otro botón; "Asignar" y la píldora quedan encima. Para el Admin la tarjeta es la misma de antes.
  - **"Asignar a alumno" en el editor de rutina** (`RoutineEditor` → `RoutineForm`), junto a "Eliminar", en dos columnas. Solo en una rutina existente y vigente. Antes de salir guarda en memoria lo escrito sin guardar, y "Volver" y Atrás lo recuperan.
- **Placeholders hasta T41 y T42:** "Asignar" lleva a `/c/planes/:id/asignar` (`AssignPlanPage`, la reemplaza T41) y "Asignar a alumno", a `/c/rutinas/:id/asignar` (`AssignRoutinePage`, la reemplaza T42). Muestran "todavía no está disponible" con un "Volver" al editor, y no piden nada al backend.
- **Sin mocks:** los endpoints son los mismos del Admin y van al backend real. Las cuentas de demo no sirven para estas pantallas (el backend rechaza su token falso).

## Rutinas del Admin

- **Pantalla** (`/a/rutinas`, `src/features/admin/pages/RoutinesPage.tsx`, que monta `RoutineList`, de `src/features/catalog/components`, compartido con el Entrenador): el caso de uso CU-E-15. El buscador (por nombre o nota del entrenador, sin acentos), el chip "Incluir inactivas" y las tarjetas de a dos columnas desde 960 px. Un botón flotante abre `/a/rutinas/nuevo`. La búsqueda y el chip quedan en la URL (`?q=…&filtro=inactivas`).
- **Tarjeta** (`RoutineCard`, un `ListItem`): el nombre, la nota del entrenador (hasta dos líneas), "N ejercicios · M circuitos" y la flecha. Una rutina dada de baja se ve apagada, con "Inactiva". Tocarla abre su editor (`/a/rutinas/:id`, ver "Editor de rutina del Admin").
- **Datos:** `GET /routine/all-plus?include_inactive=true` (`useRoutines`, en `src/features/catalog/hooks`): una sola lista con las dadas de baja incluidas, y el chip la filtra sin volver a pedirla (apagado, quedan las vigentes). Ese endpoint **no trae los ejercicios** de cada rutina, solo sus circuitos: la cantidad de ejercicios se calcula con `GET /routine/circuit/all-plus?include_inactive=true` (`useCircuits`, el mismo pedido del listado de circuitos), sumando los de cada circuito de la rutina; un circuito repetido cuenta cada vez. Si ese pedido falla, la tarjeta dice solo "N circuitos".
- **Estados:** carga, error con reintento, "Todavía no hay rutinas" (con "Crear rutina"), "No hay rutinas activas" (todas están dadas de baja) y "Sin coincidencias", que sugiere activar "Incluir inactivas" cuando por eso no se ve lo buscado.
- **Sin mocks:** `GET /routine/all-plus` y `GET /routine/circuit/all-plus` van al backend real. El seed del backend no trae rutinas: hasta que se creen, se ve el estado vacío.

## Planificaciones del Admin

- **Pantalla** (`/a/planes`, `src/features/admin/pages/PlansPage.tsx`, que monta `PlanList`, de `src/features/catalog/components`, compartido con el Entrenador): el caso de uso CU-E-08. El buscador (por nombre o descripción, sin acentos, como el `keyword` del backend), un chip por cada tipo de plan que haya, el chip "Incluir inactivas" y las tarjetas de a dos columnas desde 960 px. Un botón flotante abre `/a/planes/nuevo` (el editor, ver "Editor de planificación del Admin"). La búsqueda, el tipo y el chip quedan en la URL (`?q=…&tipo=fuerza&inactivas=1`).
- **Tarjeta** (`PlanCard`): el nombre (Barlow de 22 px, como el prototipo), la duración y el tipo ("12 semanas · Fuerza"; con 0, "Sin duración fija"), la descripción (hasta dos líneas) y una píldora "2 de 3 rutinas": las asignadas (`routine_count`, solo vínculos vigentes) sobre las que declaró el entrenador (`number_of_routines`), verde si coinciden y violeta si falta (o sobra) alguna. Una planificación dada de baja se ve apagada, con "Inactiva". Una fila vieja sin nombre (la columna admite null) dice "Sin nombre". El prototipo muestra "N alumnos" por plan: no va, porque ningún endpoint lo devuelve.
- **Datos:** `GET /planification/all?include_inactive=true` (`usePlanifications`, en `src/features/catalog/hooks`): una sola lista con las dadas de baja incluidas, y el chip y el tipo la filtran sin volver a pedirla (apagado, quedan las vigentes, como pide CU-E-08). El backend la ordena por nombre, con los sin nombre al final, y el front pone primero a las vigentes. **No trae las rutinas** del plan, solo cuántas: para eso está el detalle (T24). La query key lleva el parámetro (`planifications.list(includeInactive)`); el panel sigue pidiendo solo las vigentes.
- **Tipo:** es texto libre (hasta 30 caracteres), así que los chips salen de los datos: uno por cada tipo distinto, sin distinguir mayúsculas ("Fuerza" y "FUERZA" son el mismo chip) y por orden alfabético, más "Todos". Salen de las planificaciones que se ven (con "Incluir inactivas" apagado, de las vigentes). Un tipo de la URL que ya no existe es "Todos". El filtro se hace en el front, no con el `type` del backend.
- **Dos filtros en la URL:** `useSearchAndFilter` ahora solo toca `q` y su chip y deja el resto de la URL como está, y `useUrlFlag` (mismo archivo, `shared/lib/useSearchAndFilter.ts`) guarda un interruptor (`?inactivas=1`). Cada uno escribe su parámetro y conviven: antes el hook borraba cualquier otro.
- **Estados:** carga, error con reintento, "Todavía no hay planificaciones" (con "Crear planificación"), "No hay planificaciones activas" (todas están de baja y el chip está apagado) y "Sin coincidencias", que sugiere activar "Incluir inactivas" cuando por eso no se ve lo buscado.
- **Sin mocks:** `GET /planification/all` va al backend real. El seed del backend no trae planificaciones: hasta que se creen, se ve el estado vacío.

## Editor de rutina del Admin

- **Pantalla** (`/a/rutinas/nuevo` y `/a/rutinas/:id`, `src/features/admin/pages/RoutineEditorPage.tsx`, que monta `RoutineEditor`, de `src/features/catalog/components`, compartido con el Entrenador): los casos de uso CU-E-16, CU-E-17 y CU-E-18. Nombre (hasta 50 caracteres), nota del coach (opcional, hasta 100), los circuitos en orden y, al editar, Eliminar o Reactivar. El editor recibe un `basePath` (`/a/rutinas`) y un `circuitsPath` (`/a/circuitos`), a donde manda para editar y crear circuitos: el Entrenador pasa los suyos (T49). Guardar vuelve al listado.
- **Circuitos de la rutina** (`RoutineCircuitCard`): el nombre, cuántos ejercicios tiene, "se usa en N rutinas" (solo si son más de una: cuenta las otras rutinas vigentes que lo tienen, de `useCircuitUsage`, más esta) y sus ejercicios con la cantidad de series y su tipo (Normal, AMRAP, RM, o los dos). Se sube, baja, edita o quita. Uno dado de baja se ve con "Dado de baja": se puede conservar pero no agregar. Un circuito se puede repetir; el mínimo es 1 y el máximo 50 (con 50 se apagan los dos botones de agregar).
- **Agregar:** "Agregar existente" abre `CircuitPickerModal` con los circuitos activos (buscador por nombre o tipo) y marca los que ya están en la rutina ("En la rutina ×2"), porque se pueden volver a elegir. "Nuevo circuito" abre el editor de circuitos (T20) y, al guardar, lo suma al final de la rutina.
- **Editar, nuevo y duplicar van y vuelven:** Editar y Nuevo circuito navegan al editor de circuitos con `state.routine` (`RoutineReturn`: a dónde volver, de qué borrador es y qué tarjeta se editó). Con eso el editor de circuitos manda "Volver", Guardar y Desactivar a la rutina y no a su lista (`CircuitEditor` y `CircuitForm`). **Duplicar** desde ahí crea la copia, la deja en el lugar del original en la rutina ("Copia creada y reemplazada en esta rutina") y sigue en la copia; el vínculo del original se da de baja al guardar la rutina.
- **El borrador sobrevive al viaje** (`routineDraft.ts`): antes de salir, el formulario guarda lo escrito en memoria (`stashRoutineDraft`) y el editor de circuitos deja pendiente lo que la rutina tiene que hacer al volver (`queueRoutineOp`: sumar el circuito nuevo o reemplazar uno por su copia). Al volver, el formulario arma sus valores con lo guardado más lo pendiente. Solo se recupera si se vuelve (Guardar, "Volver" o Atrás); abrir la rutina desde el listado o por un enlace empieza de cero y descarta lo que haya quedado. Cada tarjeta lleva un `slot` propio (el id del vínculo guardado, o uno inventado si es nuevo), porque un circuito repetido no se distingue por su `circuit_id`. Si se recarga la página, el borrador se pierde (vive en memoria).
- **Datos:** el detalle sale de `GET /routine/{id}` (`useRoutine`, con `gcTime: 0`: el formulario se llena con él al abrirse y no puede arrancar de un caché viejo). Trae los circuitos con sus ejercicios y series; el contrato declara el `exercise` de cada uno como un objeto vacío (V2), así que el tipo es `RoutineTree` de `pending.ts`. Los circuitos que se agregan después se piden con `useCircuit` para tener sus series. Alta y edición mandan la rutina completa (`POST /routine/create` y `edit/{id}`, `useSaveRoutine`): los ítems que ya estaban llevan el `id` del **vínculo** `Routine_Circuit` (no el del circuito), los nuevos no, y los que no vuelven se dan de baja. `order` es la posición en la lista (1 a N). La nota del coach se manda cuando hay una; si el campo queda vacío no se manda y el backend la borra.
- **Eliminar y Reactivar** (`POST /routine/set-active/{id}`, `useSetRoutineActive`): Eliminar es una baja lógica, con confirmación. El aviso dice que la rutina deja de ofrecerse para planificaciones y asignaciones nuevas y que las planificaciones que ya la incluyen y los alumnos que ya la tienen la conservan: el prototipo dice que "se quita de las planificaciones", pero el backend no cascadea nada. Una rutina dada de baja se ve, con un aviso y los campos apagados, porque el backend rechaza editarla (400): primero se la reactiva, sin confirmación.
- **Errores:** los 400 y 404 se traducen sin mostrar el texto del servidor: rutina dada de baja, circuito dado de baja que se quiere agregar, un circuito que ya no existe, una rutina que ya no existe y una rutina que cambió mientras se editaba (un vínculo que ya no es suyo). Un 404 al abrirla dice "No encontramos la rutina" y no ofrece reintentar. Carga, error con reintento y esqueleto como los demás editores.
- **Sin mocks:** el detalle, el alta, la edición y la baja o reactivación van al backend real. Con el seed vacío (sin rutinas) hay que crear primero los circuitos que se quieran usar.

## Editor de planificación del Admin

- **Pantalla** (`/a/planes/nuevo` y `/a/planes/:id`, `src/features/admin/pages/PlanEditorPage.tsx`, que monta `PlanEditor`, de `src/features/catalog/components`, compartido con el Entrenador): los casos de uso CU-E-09 a CU-E-12d. Recibe un `basePath` (`/a/planes`); el Entrenador pasa el suyo (T49). De arriba abajo: `PlanForm` (la cabecera), `PlanRoutines` (las rutinas por semana) y `PlanStatusActions` (eliminar o reactivar).
- **Dos cosas distintas, dos formas de guardar.** La cabecera se guarda con "Guardar planificación" (`POST /planification/create` y `edit/{id}`, `useSavePlanification`). Las rutinas del plan **se aplican al instante**, cada acción con su endpoint, sin pasar por "Guardar": la sección lo dice. Al crear un plan se abre su editor (`/a/planes/:id`), porque las rutinas solo se pueden agregar a un plan que ya existe; al guardar uno existente se vuelve al listado.
- **Cabecera** (`planSchema.ts`, que replica `CreatePlanificationDto` y `EditPlanificationDto`): nombre (obligatorio, hasta 50), notas del entrenador (la `description` del contrato, opcional, hasta 1000), tipo (texto libre de hasta 30, con los chips Fuerza, Hipertrofia y Resistencia del prototipo como atajo), duración en semanas (obligatoria, entero de 0 en adelante; 0 es sin duración fija) y rutinas previstas (`number_of_routines`, obligatorio, entero de 1 en adelante). Un alta arranca con 8 semanas y tipo Fuerza, como el prototipo. Descripción y tipo vacíos no se mandan: en la edición, omitirlos los borra. Achicar la duración por debajo de la semana más alta con rutinas vigentes se avisa en el campo antes de pedirlo (el backend lo rechaza con 400); el mensaje de la duración advierte que mueve el fin de las asignaciones de todos los alumnos que tienen el plan.
- **Rutinas por semana** (`PlanRoutines`): las vigentes agrupadas por semana (`groupByWeek`, `planRoutines.ts`), con la posición de cada una (`order`, una etiqueta que puede repetirse y tener huecos; dentro de la semana se respeta el orden del backend). El título lleva "N de M rutinas": las asignadas (`routine_count`) sobre las previstas (`number_of_routines`), verde si coinciden. Una rutina dada de baja sigue apareciendo en el plan, con "Rutina inactiva".
- **Agregar** (`PlanRoutinePicker`, CU-E-12a y CU-E-12b): semana (de 1 a la duración del plan; sin duración fija, cualquiera), rutinas activas con buscador y, si se elige una sola, su posición (opcional). Una rutina se puede elegir más de una vez (el plan admite repetirla) y la selección se ve en orden. Una sola va por `POST /planification/routine/assign`, que admite posición; varias, por `assign-bulk` (una semana por lote, al final de ella, consecutivas y en el orden elegido, todo o nada, hasta 50; el contrato no declara el tope, sale de la spec del backend). Las dos devuelven el plan completo: se deja en el caché del detalle y se ve sin esperar otro pedido (`useAssignPlanRoutines`). El botón general arranca en la última semana con rutinas; el "Agregar" de cada semana, en esa.
- **Quitar y reincorporar** (CU-E-12c y CU-E-12d, `useSetPlanRoutinesActive`): quitar es una baja lógica con confirmación que conserva la semana y la posición y el historial de los alumnos (`POST /planification/routine/set-active/{id}` con un vínculo, `set-active-bulk` con varios; los ids son los del **vínculo**, no los de la rutina). Para quitar varias, "Elegir varias para quitar" convierte las filas en interruptores. Reincorporar una (`PlanReincorporateModal`) la devuelve a su lugar de antes o a otro: una semana y, opcional, una posición (sin posición va al final de la semana). Si la duración se achicó y su semana ya no existe, solo se puede elegir otra. "Reincorporar todas a su lugar" va por el lote (todo o nada).
- **Lo quitado solo vive en la pantalla.** `GET /planification/{id}` trae únicamente las rutinas vigentes y ningún endpoint lista los vínculos dados de baja, así que lo que se quita queda en memoria, en "Quitadas del plan", para poder reincorporarlo mientras no se salga de la pantalla. Al recargar o salir se pierde de vista (el vínculo sigue existiendo en el backend): agregar la rutina de nuevo crea un vínculo nuevo.
- **Eliminar y Reactivar** (CU-E-11, `POST /planification/set-active/{id}`, `useSetPlanificationActive`): Eliminar es una baja lógica con confirmación; el aviso dice que el plan deja de ofrecerse como plantilla para asignaciones nuevas y que no se quita a los alumnos que ya lo tienen ni se pierde su historial (el prototipo dice lo contrario, pero el backend no cascadea nada). Ningún endpoint dice si el plan está en uso, así que el aviso es siempre el mismo. Un plan dado de baja se ve, con un aviso, los campos apagados y las rutinas sin acciones: el backend rechaza editarlo y cambiarle las rutinas (400). Reactivar no pide confirmación.
- **Datos:** el detalle sale de `GET /planification/{id}` (`usePlanification`, con `gcTime: 0`: el formulario se llena con él al abrirse y no puede arrancar de un caché viejo; lo que cambie después, las rutinas, no pisa lo escrito). Los tipos salen del contrato, sin provisionales. Después de cada cambio se piden de nuevo las planificaciones (`planifications.all`, que incluye el detalle y los listados).
- **Errores:** los 400 y 404 se traducen sin mostrar el texto del servidor (`planErrors.ts`): plan dado de baja, rutina dada de baja, semana que supera la duración, duración menor que una semana en uso, reincorporar fuera de la duración (con un lote, "de a una"), plan, rutinas o vínculos que ya no existen. Aparecen dentro del modal o del formulario, o en un toast si el diálogo se cierra. Un 404 al abrir dice "No encontramos la planificación" y no ofrece reintentar. Carga, error con reintento y esqueleto como los demás editores.
- **Sin mocks:** todo va al backend real. Con el seed vacío (sin rutinas ni planificaciones), hay que crear primero las rutinas que se quieran usar.

## Login

- **Pantalla:** `/login` (`src/features/auth/pages/LoginPage.tsx`). El formulario usa React Hook Form con el schema `loginSchema` (`features/auth/schemas.ts`), que replica `LoginUserDto`: email de hasta 50 caracteres y contraseña de 6 a 50. El resolver de Zod es propio (`shared/lib/zodResolver.ts`), porque `@hookform/resolvers` no está en el stack.
- **Llamada:** `useLogin()` hace `POST /users/login` (real) y arma la `Session`: el token sale del header `Authorization` de la respuesta y el usuario, del body. No abre la sesión: eso lo hace la pantalla con `signIn`, y después navega con `homePathFor(session)`. Si la respuesta no trae el token (con el backend real, falta C1), no se abre nada y se avisa.
- **Errores:** un 401 dice "El email o la contraseña no son correctos." (no aclara cuál falló) y un 403, "Tu cuenta está cerrada…". Para red, 400 y 5xx valen los textos de `getErrorMessage`. Tras un 401 se vacía la contraseña y el foco vuelve a ella.
- **Contraseña temporal (B9):** el login informa siempre si se entró con una temporal, en `password_change_required` de la respuesta (`LoginResponseDto`, en el contrato desde el 17/10). Si es `true`, la sesión **no se abre**: aparece el modal bloqueante "Actualizá tu contraseña" y, recién al tocar su botón, se abre con `passwordChangeRequired` y se va a `/cambiar-contrasena`. Si se abriera antes, el guard de `PublicRoute` llevaría a esa pantalla sin que el modal llegue a verse.

## Registro

- **Pantalla:** `/registro` (`src/features/auth/pages/RegisterPage.tsx`), con `registerSchema` (`features/auth/schemas.ts`), que replica `CreateUserDto`. Todos los campos son obligatorios: nombre y apellido de hasta 50 caracteres, email de hasta 50, código de país de hasta 10, teléfono de hasta 20 y contraseña de 6 a 50. `role` no es un campo del formulario: `useRegister()` siempre manda `role: 'user'`.
- **Contraseña (V5):** el prototipo pide 8 caracteres con mayúscula y número, pero el DTO acepta desde 6 y el front valida con el DTO. Subir la regla es un cambio de backend.
- **Después del alta (V6):** `POST /users/register` devuelve un token, pero CU-U-01 pide volver al login. El front lo ignora: no abre sesión y navega a `/login` con un aviso.
- **Email ya registrado:** el backend responde 409 con `{ error: 'Ya existe un usuario con ese email' }`. La pantalla muestra un aviso con links a `/login` y `/recuperar`, deja el foco en el email y conserva lo escrito. Los demás errores usan `getErrorMessage`.
- **Teléfono:** son dos controles bajo una etiqueta: el código de país (arranca en `+54`) y el número. La etiqueta "Teléfono" es la del número, y el código tiene su propio `id` y `aria-label`. Se muestra un solo mensaje de error, el del primero que falle.
- **Sin mock:** `POST /users/register` es real. Con el backend sin responder, el alta avisa que no pudo conectarse.

## Mi cuenta

- **Menú** (`/cuenta`, `src/features/account/pages/AccountPage.tsx`): el avatar (con la foto si hay, o la inicial), el nombre, una línea según el rol y el menú de ese rol. La línea es "Miembro desde *mes año*" para el alumno, "Entrenador · *N* alumnos activos" para el entrenador (el conteo de Mis alumnos; si no carga, queda solo "Entrenador") y el email para el admin. **Datos personales** y **Cambiar contraseña** son de los tres roles (el PLAN los comparte; el prototipo se los muestra solo al alumno). El alumno suma Historial de pagos, Mis RMs y Biblioteca de ejercicios, y el entrenador, Control de membresías. Un ítem que lleva a una pantalla todavía sin hacer abre "Página no encontrada" hasta su tarea.
- **Datos personales** (`/cuenta/datos`): se precargan con `GET /users/get/{id}` (con carga, error y reintento) y se guardan con `POST /users/edit`. `profileSchema` (`features/account/schemas.ts`) replica `EditUserDto`: nombre, apellido, email y teléfono (código y número) son obligatorios, y la foto de perfil es opcional, un link `http(s)` de hasta 150 caracteres. Una foto vacía no se manda: el backend la valida como URL y el DTO no permite borrarla. Al guardar se actualiza el usuario de la sesión (`useAuth().updateUser`), el caché queda al día y se vuelve a Mi cuenta. Un 409 se muestra en el campo del email ("El email ya está en uso"). Si cambian el email o el teléfono, el backend les saca la verificación.
- **El formulario se mantiene al día** con el servidor: usa `values` con `keepDirtyValues`, así que si llega un dato nuevo se actualizan los campos que no se tocaron y se conserva lo que el usuario ya escribió.
- **Cerrar sesión** (CU-U-03, `features/auth/logout.ts`, expuesto como `useAuth().signOut`): manda `POST /users/logout` y cierra la sesión local enseguida, sin esperar la respuesta. El endpoint es público y el backend solo confirma: el cierre de verdad es descartar el token. Si el request falla, la sesión se cierra igual y no se muestra ningún error. También lo usa el "Cerrar sesión" del cambio obligatorio de contraseña.
- **Piezas que salieron de acá y se comparten:** `PhoneField` (`shared/ui`), usado por el registro y los datos personales; las reglas de cada campo de usuario (`shared/lib/userFields.ts`), que usan los schemas de auth y de cuenta; y `formatMonthYear` (`shared/lib/dates.ts`).

## Historial de pagos

- **Pantalla** (`/cuenta/pagos`, `src/features/account/pages/PaymentsPage.tsx`): es solo del rol Usuario (coach y admin que la abren a mano vuelven a su inicio, y su menú no la muestra). Lee `GET /membership/payment/user/{id}` (real), que el backend devuelve **sin ordenar**: la lista se ordena del pago más reciente al más antiguo, por la fecha en que se registró. Cada pago muestra el plan, cuándo se pagó, cuándo vence y el monto, que es una copia de lo que costaba ese día.
- **La membresía actual** sale del pago de **vencimiento más lejano**, no del más reciente por fecha: un trimestral pagado hace un mes manda sobre un mensual pagado ayer. Es la misma regla del backend (`shared/lib/membershipStatus.ts`).
- **El estado** se calcula con el `expired_at` de ese pago, no con el flag `active` del pago, que el backend actualiza una sola vez por día: **Activa** (verde), **Por vencer** (amarillo, desde 7 días antes, hasta el final de ese día) o **Vencida** (rojo; entonces la tarjeta dice "Última membresía" y "Venció"). El backend configura esa ventana con `MEMBERSHIP_EXPIRING_SOON_DAYS` y la informa en el resumen de membresías, pero ese endpoint es solo de entrenadores y admins, así que el alumno usa el valor por defecto (`EXPIRING_SOON_DAYS`).
- **Estados de la pantalla:** carga (esqueleto), error con reintento, y sin pagos ("Todavía no tenés pagos", sin tarjeta). Mi cuenta muestra el estado en una píldora bajo el nombre, con la misma query, así que los pagos se piden una sola vez; si no cargan, la píldora no se muestra y el historial tiene su propio error.
- **Formatos:** `formatDate` ("15 Jul 2026", en el día local de quien mira) y `formatPrice` ("$18.000", pesos argentinos con hasta dos decimales), en `shared/lib`.

## Mis alumnos

- **Pantalla** (`/c/alumnos`, `src/features/coach/pages/StudentsPage.tsx`): el home del Entrenador. De arriba hacia abajo: el encabezado con el botón de Membresías y el avatar que lleva a Mi cuenta, los contadores, el buscador, los chips y el listado. Tocar una fila abre `/c/alumnos/:id`, el detalle del alumno (más abajo).
- **No hay vínculo entrenador-alumno:** "alumnos" son todos los usuarios con `role=user`. El listado es `GET /users/all?role=user` (real), de a 20, del alumno más nuevo al más viejo (así los ordena el backend). "Cargar más" pide la página siguiente, y si falla, la lista cargada se queda y el botón pasa a "Reintentar". Cada fila muestra la foto o la inicial, el nombre, el email y el estado de la cuenta (Activo o Inactivo, con el avatar gris). La adherencia y la última sesión del prototipo no van: no hay datos (T45).
- **Búsqueda** (CU-E-02): `keyword`, que el backend busca de forma parcial, sin distinguir mayúsculas, en nombre, apellido y email. Se manda 300 ms después de la última tecla, sin espacios en los bordes y hasta 100 caracteres (el límite del DTO). Mientras llega el resultado nuevo, la lista anterior queda a la vista, apagada.
- **Chips** Todos, Activos e Inactivos: el parámetro `active` (el estado de la cuenta, no el de la membresía).
- **Contadores** Activos, Inactivos y Total: el `total` de `GET /users/all?role=user&active=…&limit=1`, dos requests, y el total es su suma. Son de todos los alumnos y no cambian con la búsqueda ni con el chip. Si no cargan, muestran "–".
- **Botón de Membresías** (`/c/membresias`): el contador suma los alumnos con la membresía **por vencer o vencida** de `GET /membership/status/summary` (real, solo de entrenador y admin). Si el resumen no carga, el botón queda sin contador. El prototipo hace esa misma suma ("requieren atención").
- **La URL guarda la búsqueda y el chip** (`?q=ana&estado=inactivos`) y se leen solo al abrir la pantalla: volver del detalle con Atrás deja la lista como estaba. Cambiarlos no agrega entradas al historial.
- **Estados:** carga (esqueleto), error con reintento, y vacío en tres variantes: "Todavía no hay alumnos" (CU-E-01), "No hay alumnos activos" o "inactivos" (con el chip) y "No hay alumnos que coincidan con la búsqueda" (CU-E-02).
- **Piezas que se comparten:** `useDebouncedValue` (`shared/lib`) y `AccountLink` (`features/account`), el avatar de la barra superior, que va a usar también el home del Usuario.

## Detalle de alumno del Entrenador

- **Pantalla** (`/c/alumnos/:id`, `src/features/coach/pages/StudentDetailPage.tsx`): el encabezado (avatar de 64 px, el estado de la cuenta, Activo o Inactivo con el avatar gris, y "Alumno desde…"), una ficha con el email, la membresía y la planificación vigente, y el menú: RMs del alumno, Historial de entrenamientos, Historial de pagos y Registrar pago. Abajo, "Cerrar cuenta del alumno" (o "Reactivar cuenta" si está inactiva). La ficha es `StudentDetails` (`features/account/components`), la misma del detalle de usuario del Admin: la membresía sale del último pago y la planificación solo se muestra si el backend la responde. La adherencia, las sesiones y los meses del prototipo no van: no hay datos (T45).
- **Datos:** `GET /users/get/{id}` (real). Un id que no existe (404), que no es un UUID (400) o que es de un entrenador o un admin muestra "No encontramos al alumno", sin reintento: esta pantalla da de baja cuentas y no es para ellas. Cualquier otro error, con reintento.
- **RMs** (CU-E-04): un modal de solo lectura, porque los RMs los carga el propio alumno. `GET /user_rm/user/{id}` (real) trae los RMs de todos los ejercicios, sueltos y sin ordenar, cada uno con su ejercicio (`id` y `name`) y su usuario anidados, además de `exercise_id` y `user_id` (`UserRmDetailDto`, V10 resuelto en el contrato el 17/10). Se agrupan por ejercicio, en orden alfabético, y dentro de cada uno del más reciente al más antiguo, con el peso, las repeticiones y la fecha (`groupRmsByExercise`, en `shared/lib/rms.ts`). Se piden al abrir el modal, no al entrar. Con carga, error con reintento y "Todavía no registró RMs".
- **Historial de pagos** (CU-E-05): un modal con `GET /membership/payment/user/{id}` (real), que comparte la query con la ficha: se pide una sola vez. Va del pago más reciente al más antiguo (`newestPaymentsFirst`, el mismo orden del historial del Usuario) y cada uno muestra el plan, cuándo se pagó, cuándo vence y el monto. Con carga, error con reintento y "Todavía no tiene pagos".
- **Cerrar cuenta** (CU-E-03): `POST /users/set-active/{id}` con `{ "active": false }`. Pide confirmación, aclara que es una baja lógica (el alumno no puede ingresar, sus datos y sus pagos se conservan) y que se puede reactivar, y vuelve a Mis alumnos con "Cuenta cerrada". **Reactivar** manda `{ "active": true }` sin confirmación y deja la pantalla abierta, con "Cuenta reactivada". Después se piden de nuevo los listados y los contadores de usuarios. El backend no distingue roles al cambiar el estado: por eso la pantalla solo abre cuentas de alumnos.
- **Historial de entrenamientos** (CU-E-06 y CU-E-07): un modal, explicado en "Historial de entrenamientos del Entrenador".
- **Registrar pago** va a `/c/pago?alumno=<id>`, con el alumno elegido (ver "Registrar pago del Entrenador").
- **Fechas sin hora:** el `date` de un RM llega como "2026-10-01". JavaScript lo lee en UTC y en Argentina se vería un día antes, así que `formatDate` (`shared/lib/dates.ts`) muestra una fecha sin hora como el día de calendario que es. Las planificaciones también usan `date`.

## Historial de entrenamientos del Entrenador

- **Pantalla** (CU-E-06 y CU-E-07): un modal que se abre desde la fila "Historial de entrenamientos" del detalle del alumno (`StudentHistoryModal`, `src/features/coach/components`), como el prototipo (`alHist`) y como los RMs y los pagos del mismo detalle. No tiene ruta propia. Es de solo lectura y muestra las sesiones del alumno con al menos un ejercicio hecho, **de la más reciente a la más antigua**.
- **Datos** (real): `GET /routine/history/{userId}` (B6, solo coach y admin), con `useTrainingHistory` (`features/coach/hooks`). Se muestra en el orden en que lo manda el backend: no se reordena. Con un ejercicio elegido pide `GET /routine/history/{userId}?exercise_id=<id del catálogo>`: el backend devuelve solo las sesiones donde lo hizo y, en cada una, únicamente ese ejercicio. Son dos queries (`queryKeys.trainingHistory.byUser`) y la lista completa queda en el caché, de donde sale el selector. Se piden al abrir el modal, no al entrar al detalle.
- **La sesión** (`HistorySessionCard`): la rutina, el día, un rótulo de dónde viene ("Individual") y, debajo, cada ejercicio con sus series, la nota del alumno y, si no es el de la sesión, el día en que se hizo. Se muestran 10 sesiones y el resto con "Ver más sesiones": el backend no pagina.
- **Qué son las series:** la **prescripción vigente de la rutina**, no lo que levantó el alumno. El modelo no guarda la carga real, y si el entrenador edita el circuito después, el historial viejo muestra la prescripción nueva. Lo dice un aviso arriba del listado y cada ejercicio rotula sus series con "Prescripto", porque el aviso se pierde al hacer scroll. Cada bloque se escribe con `formatSetBlock` ("4×8 · 80 kg · RPE 7").
- **Filtro por ejercicio:** "Todos los ejercicios", los que hizo el alumno y el resto del catálogo (`GET /exercise/all`), para consultar uno que no hizo y ver "Sin registros para este ejercicio". Al reabrir el modal vuelve a "Todos".
- **Estados:** carga, "Todavía no registra entrenamientos" (sin filtro), "Sin registros para este ejercicio" y error con reintento, tanto el de la lista completa como el del pedido filtrado.
- **Sesiones del plan (BE-20d):** el backend las publicó el 24/10 (`source: 'plan'`, con `week` y `planification { id, name }` en lugar de `assignment_id`) y T44 las incorporó: `RoutineHistorySession` (`src/api/types.ts`) es la unión de `RoutineHistoryIndividualSession` y `RoutineHistoryPlanSession`, `originLabel` (en `HistorySessionCard`) dice "Plan · Semana N" y el nombre de la plantilla (que puede ser `null`) va debajo del día. La clave de cada sesión (`sessionKey`, en `shared/lib/trainingHistory.ts`) no depende de `assignment_id`.

## Control de membresías del Entrenador

- **Pantalla** (`/c/membresias`, `src/features/coach/pages/MembershipsPage.tsx`): se entra desde el botón de Membresías de Mis alumnos (o la barra lateral). De arriba hacia abajo: los contadores, "Registrar nuevo pago", el buscador, los chips de estado, el selector de tipo y la lista.
- **Contadores** (CU-E-26): `GET /membership/status/summary` (real, solo de entrenador y admin). Activas, Por vencer, Vencidas y Sin pagos; el prototipo tiene tres, "Sin pagos" se suma porque la API lo informa. Son de todos los alumnos, también de los de cuenta inactiva (así los cuenta el backend), y los filtros no los cambian. Si no cargan, muestran "–".
- **Lista** (CU-E-27 y CU-E-28): `GET /membership/status/users?status=…` (real; sin schema en el contrato, tipada en `pending.ts`, V1). Cada alumno trae el estado, el vencimiento y el tipo de su último pago. Con un chip se pide solo ese estado; con "Todas", los cuatro (uno por request, porque no hay un endpoint con el estado de cada alumno) y se juntan. Es todo o nada: si uno falla, error con reintento y no una lista que parezca completa. Ordena del vencimiento más viejo al más lejano y deja al final a quienes nunca pagaron.
- **Filtros:** el selector de **tipo de membresía** usa `GET /membership/all` (CU-E-25), con los tipos dados de baja marcados (un alumno puede tener un último pago de uno), y filtra por el tipo del último pago, que ya trae cada alumno (por eso no se pide `GET /membership/type/users`). La **búsqueda** es local, por nombre o email y sin acentos, porque el backend manda a todos sin paginar. La búsqueda y el chip quedan en la URL (`?q=…&estado=vencidas`), así que volver de registrar un pago deja la lista como estaba; el tipo no.
- **Cada alumno:** el avatar (gris si está vencida o sin pagos), el nombre, el tipo, la píldora de estado y "Vence" o "Venció" con la fecha y los días (`daysUntil` y `formatDaysUntil`, en `shared/lib/dates.ts`: "12 días", "hoy", "hace 3 días"). El botón es **Registrar pago**, o **Renovar** si ya venció, y abre `/c/pago?alumno=<id>`; "Registrar nuevo pago" abre `/c/pago` sin alumno.
- **Estados:** carga (esqueleto), error con reintento y vacío: "No hay alumnos en este estado", "Todavía no hay alumnos" o "Sin coincidencias" (con búsqueda o tipo elegido). Sin tipos de membresía, el selector queda deshabilitado con "Sin tipos de membresía".

## Registrar pago del Entrenador

- **Pantalla** (`/c/pago`, `src/features/coach/pages/RegisterPaymentPage.tsx`): se entra desde "Registrar nuevo pago" y "Registrar pago" o "Renovar" del control de membresías, y desde "Registrar pago" del detalle del alumno. Cubre altas y renovaciones: no existe "renovar" como operación aparte (CU-E-29).
- **Alumno:** con `?alumno=<id>` llega elegido (`GET /users/get/{id}`), como una fila con "Cambiar". Sin él, un buscador por nombre o email y la lista de alumnos de a páginas (`GET /users/all?role=user`), con los de cuenta inactiva marcados: el backend les deja registrar un pago. Si el id no existe, no es un UUID o es de un entrenador o un admin, un aviso lo dice y se puede elegir a otro. La pantalla arranca de nuevo si cambia el alumno de la URL.
- **Tipo de membresía:** `GET /membership/all`, solo los **activos** y de menor a mayor duración, porque el backend trae también los dados de baja y no valida `active` al registrar. Arranca en el tipo del último pago del alumno, si todavía se ofrece. Sin tipos activos, el selector queda apagado con un aviso.
- **Monto y fecha de pago** solo se muestran. La fecha no se elige: el backend no la recibe y usa el día del pago, así que va fija como "Hoy" (el prototipo tiene un campo de fecha).
- **Resumen:** el tipo, la vigencia ("hoy → hoy más la duración") y el total. Es una vista previa: el vencimiento lo calcula el backend, al final del día. **No suma lo que le quedaba al alumno:** con una membresía activa o por vencer, un aviso lo dice con su vencimiento (y si el pago nuevo vence antes que el actual, el actual sigue mandando).
- **Confirmar:** `POST /membership/payment/register` con solo `{ "user_id": …, "membership_id": … }` (real, `useRegisterPayment`). Después invalida `queryKeys.memberships.all`, muestra "Pago registrado · Nombre" y vuelve al control de membresías. Un error se muestra sobre el botón ("Ese tipo de membresía ya no existe", "El alumno ya no existe" o el aviso por defecto) y se va al elegir otro tipo. Un pago no se puede anular: el backend no tiene endpoint para eso.
- **Estados:** carga (esqueleto del alumno elegido y "Cargando…" en el selector), error de los tipos con reintento y todos los avisos de arriba.

## Home del Usuario

- **Pantalla** (`/u/plan`, `src/features/user/pages/PlanPage.tsx`): CU-U-08, el home del alumno. Las rutinas de una semana, de lunes a domingo, con un selector de semana y un botón a la biblioteca de ejercicios (la wiki). La tab Rutina queda marcada también en el detalle de una rutina.
- **Datos (todo real):** un solo pedido, `GET /routine/home/{userId}?date=&week=1` (`useRoutineHome`, en `features/user/hooks`), con el lunes de la semana en `date`: responde `[{ week_start, week_end, individual, plan }]` (B1 y B5, tipados con el contrato, sin provisionales). La app manda siempre `date` (el hoy del dispositivo) para no depender del hoy en Argentina del backend. Al cambiar de semana se sigue viendo la anterior, apagada, hasta que llega la nueva.
- **Plan** (`PlanWeekGroup`): un grupo por planificación. Tarjeta con el nombre, "Semana N de M" (sin "de M" si la duración es 0), los ejercicios que hizo en esa semana, el porcentaje y la barra, la nota del entrenador y "Dada de baja" si el plan se dio de baja; debajo, sus rutinas en el orden del entrenador, sin día, con la letra A, B, C... según su lugar. **El porcentaje es el de la semana**, no el del plan entero: el contrato solo trae el progreso de las rutinas de cada semana (el prototipo muestra uno global).
- **Individuales:** las rutinas que el entrenador asignó para un día, ordenadas por fecha, con el día en el subtítulo y la píldora "Hoy" si es hoy.
- **Una rutina** (`HomeRoutineRow`): "N de M ejercicios" (hecha cuando hizo todos: píldora "Hecha" y fila apagada), "Sin ejercicios", "Dada de baja" si la rutina se dio de baja (se puede ejecutar igual) y "Quitada" si el entrenador la sacó del plan después de que el alumno la hiciera (solo se ve lo que hizo).
- **Semana en la URL:** `?semana=2026-10-19` (el lunes); sin parámetro es la actual, y cambiarla no suma entradas al historial. "Volver a esta semana" aparece cuando no es la actual. Los helpers de calendario (`addDays`, `mondayOf`, `weeksBetween`, `formatDayRange`, `formatWeekdayDate`) están en `shared/lib/dates.ts` y trabajan con el día `YYYY-MM-DD` como día de calendario, sin pasarlo por la zona horaria.
- **Detalle:** tocar una rutina abre `/u/rutina/:id` (individual, con el `id` de su asignación) o `/u/rutina/plan/:userPlanificationId/:routineAsignationId` (del plan); los paths salen de `homeState.ts`. El home le pasa su búsqueda al detalle por el `state` de la navegación (`HomeLocationState`) y `homeBackTo(state)` arma el "Volver", para que quede la misma semana. El detalle es la pantalla de la sección siguiente.
- **Estados:** carga (esqueleto), error con reintento, una semana sin nada ("Sin rutinas esta semana") y un plan sin rutinas esa semana ("Esta semana del plan no tiene rutinas.").

## Detalle de rutina del Usuario

- **Pantalla** (`RoutineDetailPage`, `src/features/user/pages`): CU-U-09, la rutina de una asignación con lo que el alumno ya hizo. Se abre desde el home y tiene dos rutas con la misma pantalla: `/u/rutina/:id` (una rutina individual) y `/u/rutina/plan/:userPlanificationId/:routineAsignationId` (una rutina de una semana del plan). "Volver" deja el home en la semana de la que vino (`homeBackTo`).
- **Datos (todo real, solo lectura):** `GET /routine/assign-user/{id}` y `GET /routine/assign-plan/{userPlanificationId}/{routineAsignationId}` (`useIndividualRoutine` y `usePlanRoutine`, en `features/user/hooks/useRoutineDetail.ts`). Los dos traen `routine`, el árbol de `GET /routine/{id}` (circuitos en orden, cada uno con sus ejercicios y series), y `finished[]`, lo que el alumno hizo, que se cruza con el árbol por `routine_exercise_id`, el `id` de cada ejercicio. Se piden con `request` y tipos provisionales de `pending.ts` (`RoutineTree`, `AssignedRoutineDetail` y `PlanSessionDetail`) porque el contrato declara el `exercise` de cada ejercicio como un objeto vacío (V2), igual que el circuito.
- **Una vista para las dos vías** (`routineDetail.ts`): `individualView` y `planSessionView` llevan las dos respuestas a `RoutineView` (la rutina, lo hecho por id, el sobretítulo, los avisos y `frozen`), y `routineStats` cuenta los ejercicios, las series y los hechos sin repetir ejercicios, como el progreso del home.
- **Pantalla:** sobretítulo con el día ("Mié 21 Oct") o con el plan y su semana ("Fuerza 5×5 · Semana 3 de 8"), el nombre de la rutina, tres estadísticas (ejercicios, series y hechos), los avisos y las notas, y los circuitos como "Circuito 1 · Empuje" con su tipo, cada uno con sus ejercicios (`RoutineCircuit` y `RoutineExerciseRow`). Cada ejercicio muestra su foto, su nombre y una línea por bloque de series ("3×8 · 80 kg · RPE 7"); si lo hizo, la fila se apaga y dice "Hecho", el día y la nota del alumno. Una columna en mobile y dos desde 960 px.
- **Avisos:** la planificación quitada al alumno (solo lectura: `frozen`), la rutina quitada del plan (se ve solo lo que hizo), y la planificación o la rutina dadas de baja (informativos: se pueden seguir ejecutando). Más la nota del plan, la que el entrenador dejó al asignarlo, y la nota del entrenador de la rutina.
- **Errores:** 403 ("Esta rutina no es tuya"), 404 y 400 ("No encontramos la rutina", o "Tu entrenador la quitó del plan y no hiciste nada en ella" cuando el backend lo dice) no se reintentan; el resto da el error con reintento.
- **Cada ejercicio es un botón:** abre su detalle (ver "Detalle de ejercicio del Usuario"), con una flecha al final de la fila.

## Detalle de ejercicio del Usuario

- **Pantalla** (`RoutineExercisePage`, `src/features/user/pages`): CU-U-10 a CU-U-13, un ejercicio de la rutina de una asignación. Se abre tocando un ejercicio del detalle de la rutina y **cuelga de sus rutas**: `/u/rutina/:id/ejercicio/:routineExerciseId` (individual) y `/u/rutina/plan/:userPlanificationId/:routineAsignationId/ejercicio/:routineExerciseId` (del plan). El ejercicio sale del árbol del detalle de la rutina y necesita saber de qué asignación es, así que no hay un `/u/ejercicio/:id` suelto. `routineExerciseId` es el `id` del ejercicio en la rutina (el que cruza con `finished[]`), no el de la ficha del catálogo. "Volver" lleva al detalle de la rutina y le devuelve el `state` de la navegación, así que el home sigue en la misma semana.
- **Datos:** el ejercicio sale del caché del detalle de la rutina (`useIndividualRoutine` y `usePlanRoutine`, la misma query que el detalle: sin otro pedido; con un link directo se pide una vez). Los músculos de la cabecera salen de `GET /exercise/{id}` (`useExercise`, con el listado como adelanto): si no llegan, la ficha se ve igual sin ese bloque. Los RMs son los de `GET /user_rm/user/{id}` (`useUserRms`, el mismo caché que Mis RMs) filtrados por el `id` de la ficha (`rmsOfExercise`, en `shared/lib/rms.ts`).
- **Pantalla:** la cabecera del ejercicio (`ExerciseHero`: miniatura y músculos), "Tu RM actual" (el más reciente, con sus repeticiones y fecha; sin ninguno, "Sin RM" y "Registrar RM") y "Series objetivo" ("4×8", o "7 series" si hay varios bloques); "Mis series", el atajo al temporizador, la nota del entrenador y "Tu registro"; y a la derecha en escritorio (debajo en mobile) "Mis RMs" y el resto de la ficha (`ExerciseDetails`: descripción, tips y video). Una columna en mobile y dos desde 960 px.
- **Series** (`ExerciseSetList`): un bloque `set_count: 3` con `rep_count: 8` son tres filas ("Serie 1" a "Serie 3", `expandSetBlocks`, en `shared/lib/sets.ts`), cada una con sus parámetros ("8 reps · 80 kg · RPE 7", `formatSetTarget`) y su tipo (Normal, "AMRAP · 60s" o RM, `formatSetKind`). **Tildar una serie es solo de la interfaz:** el backend guarda el ejercicio completo, no cada serie. El tilde vive fuera de React (`exerciseTicksStore.ts`, como el temporizador y con el usuario en la clave): el alumno tilda, se va al temporizador a descansar y, al volver, sigue donde estaba. No persiste: al recargar arranca de cero. Con el ejercicio marcado como hecho, todas se ven hechas. Sin series cargadas, un aviso, y el ejercicio se puede marcar igual.
- **Marcar, desmarcar y anotar** (CU-U-12 y CU-U-13, `ExerciseLog` y `useExerciseFinished.ts`): es **por ejercicio**. "Marcar hecho" manda `POST /routine/assign-user/{id}/finished` con `routine_exercise_id` y `finished_at` de hoy (`toCalendarDay()`); en una rutina del plan, el mismo cuerpo va a `POST /routine/assign-plan/{userPlanificationId}/{routineAsignationId}/finished` (T40b). "Lo hice otro día" (y "Cambiar el día", con el ejercicio ya marcado) y "Dejar nota" / "Editar nota" abren un modal (`ExerciseLogModal`) con el día (no futuro) y la nota (hasta 100 caracteres, `exerciseLogSchema`): **la nota se guarda con la marca**, así que anotar un ejercicio sin marcar lo marca ese día. Una nota vacía la borra y el ejercicio sigue marcado; sin marca y sin nota, no se manda `user_note` (omitirla no la toca). "Desmarcar" es `DELETE …/finished/{routineExerciseId}` (en el plan, `DELETE /routine/assign-plan/{up}/{ra}/finished/{routineExerciseId}`) y borra la nota: con una nota, pide confirmación. Las dos son idempotentes en el backend (201 si crea la marca, 200 si ya estaba).
- **Actualización optimista:** el cambio se ve al instante en el caché del detalle (`finished[]`) y se revierte si el servidor falla, con un toast ("No pudimos guardarlo…", o el del error). Al terminar se invalidan `queryKeys.routineDetail.all` y `queryKeys.routineHome.all` (el progreso del home). Las mutaciones de una misma asignación se hacen de a una, en orden (`scope` de TanStack Query). El modal se cierra al guardar, sin esperar al servidor.
- **Qué se puede hacer** (`exerciseAccess`, en `routineDetail.ts`): `open` en las rutinas individuales **y en las del plan** (T40b: el par de endpoints del plan, BE-20c, está en Render desde el 24/10; `postFinished` y `deleteFinished`, en `useExerciseFinished.ts`, eligen el par por el tipo de `RoutineAssignment`, y la query key, el `scope` y el progreso salen de la misma asignación); y `frozen` si el entrenador le quitó la planificación (no se marca ni se anota, solo se ve lo hecho y los RMs; el backend responde 400 si igual se intentara). En una rutina que el entrenador quitó del plan, el backend no admite marcas nuevas pero sí corrige o desmarca lo ya hecho, que es justo lo único que la pantalla muestra; si el alumno desmarca el último ejercicio hecho, la rutina deja de existir para él (404 del detalle: "Tu entrenador la quitó del plan y no hiciste nada en ella").
- **Errores:** los de la rutina (403 "Esta rutina no es tuya", 404 y 400 "No encontramos la rutina") son los del detalle (`RoutineLoadError`); un ejercicio que ya no está en la rutina, "No encontramos el ejercicio"; los RMs que no cargan, un error con reintento en su sección (la tarjeta de arriba queda en "—"). Al marcar o desmarcar, el toast traduce el 400 (en el plan: "Puede que tu entrenador haya cambiado la rutina o te haya quitado la planificación"), el 403 ("Esta rutina no es tuya") y el 404, y la pantalla vuelve a como estaba.

## Mis RMs del Usuario

- **Pantalla** (`/u/rms`, `src/features/user/pages/RmsPage.tsx`): se entra desde el tab RMs y desde Mi cuenta. De arriba hacia abajo: "Registrar RM" y "Calculadora", "Registrados" con la cantidad de ejercicios y los RMs agrupados por ejercicio (CU-U-17 a CU-U-20).
- **Lista** (CU-U-19): `GET /user_rm/user/{id}` con el id de la sesión (real, `useUserRms`; llega con la forma de `UserRmDetailDto`, ver "Detalle de alumno del Entrenador"). Los ejercicios van en orden alfabético y, dentro de cada uno, del RM más reciente al más antiguo (`groupRmsByExercise`, en `shared/lib/rms.ts`). Cada fila muestra las repeticiones, la fecha y el peso, con los botones de editar y eliminar. Un ejercicio puede tener varios RMs: el contrato guarda peso, repeticiones y fecha de cada uno, y el prototipo (un solo RM por ejercicio) no. Sin RMs: "Todavía no registraste ningún RM".
- **Alta y edición** (CU-U-17 y CU-U-18): un modal (`RmFormModal`) con ejercicio, peso, repeticiones y fecha. `POST /user_rm/create` y `POST /user_rm/edit/{id}` (reales, `useSaveRm`) mandan además el `user_id` de la sesión, que el backend compara con el suyo. Los ejercicios salen de `GET /exercise/all` (público) y la fecha arranca en hoy. **Editar no cambia el ejercicio** (CU-U-18: peso, repeticiones o fecha): el campo queda apagado. Reglas del schema (`rmSchema`, en `features/user/schemas.ts`): peso de 1 kg o más (el DTO pide `@Min(0.99)`), hasta dos decimales y hasta 1.000 kg; repeticiones enteras de 1 a 100; fecha válida y no futura. Los topes de 1.000 kg y 100 repeticiones y lo de la fecha futura son del front, no del DTO.
- **La fecha viaja con el mediodía** (`2026-10-06T12:00:00`): el backend la lee con `new Date(date)` y toma el día con la zona horaria de su servidor, así que un día pelado (medianoche UTC) cae un día antes en un servidor al oeste de UTC, y cada edición lo corre otro más. En Render (UTC) no se nota; en un backend local en Argentina sí.
- **Eliminar** (CU-U-20): `DELETE /user_rm/{id}` (real, `useDeleteRm`), un borrado físico con confirmación ("No se puede deshacer"). Si el RM ya no existe (404), avisa y actualiza la lista; lo mismo pasa al editarlo.
- **Estados:** carga (esqueleto), error con reintento, vacío, y los errores del guardado dentro del modal (el ejercicio o el RM ya no existe, o el aviso por defecto).
- **Calculadora:** el botón abre `/u/calculadora` (ver "Calculadora de RM del Usuario").

## Wiki de ejercicios del Usuario

- **Lista** (`/u/wiki`, `src/features/user/pages/WikiPage.tsx`): se entra desde Mi cuenta ("Biblioteca de ejercicios"), y la tab Rutina queda marcada. De arriba hacia abajo: "Biblioteca / Ejercicios", el buscador por nombre (sin mayúsculas ni acentos), los chips por grupo muscular y las filas (CU-U-15). Cada fila trae la miniatura (la `preview_image`, o un ícono), el nombre y los músculos en una línea, y abre la ficha. La búsqueda y el grupo quedan en la URL (`?q=…&grupo=<id>`).
- **Datos** (reales, solo lectura): `GET /exercise/all` (público) cruzado con `GET /muscles/mg/all` (`useExerciseCatalog`: cada ejercicio es de los grupos a los que pertenecen sus músculos, como en el listado del Admin) y `GET /exercise/{id}` para la ficha (pide sesión de cualquier rol, `useExercise`). El buscador y los chips son los mismos que los del Admin (`useExerciseSearch` y `ExerciseFilters`, en `src/features/catalog`).
- **Ficha** (`/u/wiki/:id`, `WikiExercisePage` y `ExerciseSheet`): el nombre, la cabecera del ejercicio (la imagen de fondo `bg_image` con un velo, la miniatura `preview_image` y los músculos que trabaja) y, solo si el ejercicio los tiene, la descripción, los tips de seguridad, los tips de activación y el video. El video es un link (`ButtonLink`, "Ver video") que se abre en otra pestaña. Una imagen que no carga no se muestra y un link que no es http o https no se abre (`isHttpUrl`, en `shared/lib/url.ts`): los links los carga el Admin como texto libre.
- **Abre al instante:** si la lista ya se cargó, la ficha muestra el ejercicio del caché del listado (`useExercise(id, { placeholderFromList: true })`) y lo confirma con `GET /exercise/{id}`. Con un link directo, muestra un esqueleto hasta que llega.
- **"Volver":** desde la lista va al plan (`/u/plan`, como el prototipo); desde la ficha vuelve a la lista con su búsqueda y su chip (la lista le pasa su `location.search` por el `state` de la navegación, `wikiState.ts`).
- **Estados:** carga (esqueleto), error con reintento, catálogo vacío, sin coincidencias ("No hay ejercicios con ese nombre. Probá con otra búsqueda o categoría.") y, en la ficha, "No encontramos el ejercicio" (404 o 400) sin reintento.

## Calculadora de RM del Usuario

- **Pantalla** (`/u/calculadora`, `src/features/user/pages/CalculatorPage.tsx`): se entra desde el botón Calculadora de Mis RMs, y la tab RMs queda marcada. De arriba hacia abajo: la explicación (con el aviso de que es una estimación y no se guarda en los RMs), el ejercicio, el peso y las repeticiones, la tarjeta del 1RM estimado y la tabla de 1RM a 12RM (CU-U-16).
- **El cálculo lo hace el backend** (`POST /user_rm/potential`, real, `usePotentialRms`): Epley, con el 1RM directo y la tabla de 1 a 12 repeticiones, sin guardar nada. El front no repite la cuenta. No hay botón: se calcula solo 400 ms después del último cambio, cuando los tres datos son válidos, como el prototipo (que calcula al escribir). Es una query (`queryKeys.rmPotential`) con `staleTime: Infinity`: el mismo ejercicio, peso y repeticiones dan el mismo resultado y vuelven del caché sin pedir de nuevo. Mientras se calcula otra cosa queda el resultado anterior, apagado; si un dato deja de ser válido, el resultado se vacía.
- **Campos** (`potentialRmSchema`, en `features/user/schemas.ts`): el ejercicio, que el endpoint pide aunque la cuenta no dependa de él (responde 404 si no existe); el peso, mayor a cero, con hasta dos decimales y hasta 1.000 kg; y las repeticiones, enteras de 1 a 100. Los avisos aparecen al escribir. Con más de 12 repeticiones, un aviso dice que la estimación pierde precisión (la tabla del backend llega a 12).
- **Resultado:** el 1RM con hasta dos decimales (los que calcula el backend) y la tabla con el porcentaje del 1RM, el peso y las repeticiones de cada fila. La fila de las repeticiones ingresadas muestra el mismo peso ingresado, con el peso en violeta. Los números no se redondean a enteros como en el prototipo, justamente para que esa fila coincida.
- **Estados:** "Calculando…" mientras llega el primer resultado, el cálculo anterior apagado mientras llega el siguiente, y los errores: el servidor, con reintento, y un ejercicio que ya no existe (404), sin reintento.

## Temporizador del Usuario

- **Pantalla** (`/u/timer`, `src/features/user/pages/TimerPage.tsx`): la tab Timer. De arriba hacia abajo: "Descanso entre series / Temporizador", el reloj (el anillo que se vacía y, en el centro, lo que queda y el estado), las duraciones (30 s, 60 s, 90 s, 2:00 y 3:00) y "Reiniciar" con el botón principal (CU-U-14). Es solo del Usuario y no usa la API.
- **Estados:** arranca en 90 s, detenido ("listo", botón "Iniciar"). Elegir una duración arranca el conteo desde ahí. Corriendo dice "restante" y el botón "Pausar"; en pausa, "en pausa" y "Reanudar"; al llegar a cero, "Descanso terminado" y "Repetir". "Reiniciar" vuelve al principio de la duración elegida, sin correr.
- **Sigue corriendo si cambiás de pantalla:** el estado no es de la pantalla sino de `restTimerStore.ts` (un módulo fuera de React, como la sesión, que `useRestTimer` lee con `useSyncExternalStore`). Por eso también sigue al ir a Perfil, que es otro shell. No persiste nada: al recargar la página arranca de cero, y al cerrar la sesión vuelve a su estado inicial.
- **Cuenta contra el reloj**, no contando ticks: guarda cuándo termina y recalcula cada 250 ms y al volver a la pestaña, porque los navegadores frenan los timers en segundo plano. Una pausa guarda lo que quedaba y el tiempo parado no cuenta.
- **Al llegar a cero** (`RestTimerWatcher`, montado en `Providers`): un toast "Descanso terminado" en la pantalla que sea y vibración (`navigator.vibrate`) si el dispositivo la tiene. No hay notificación del sistema ni sonido: con el celular bloqueado o la app en segundo plano el aviso puede pasar sin que se lo vea, y al volver el reloj ya dice "Descanso terminado".
- **Accesibilidad:** el reloj es `role="timer"` (no anuncia cada segundo; el final lo anuncia el toast), los chips dicen "30 segundos", "2 minutos"…, y la animación del anillo se apaga con `prefers-reduced-motion` (regla global).

## Cambiar contraseña

- **Una pantalla, dos formas** (`/cambiar-contrasena`, `src/features/auth/pages/ChangePasswordPage.tsx`). El **obligatorio** es el de quien entró con una contraseña temporal (`session.passwordChangeRequired`): es la única pantalla que puede ver, dice "Paso 3 de 3", no tiene "Volver" y ofrece "Cerrar sesión" como salida. Al terminar llama a `completePasswordChange()`, que libera el guard, y va al inicio de su rol. El **voluntario** se abre desde Mi cuenta (T13 va a linkear acá), con "Volver" a `/cuenta`, y vuelve a ella.
- **Campos:** contraseña actual, nueva y repetir, con `changePasswordSchema` (`features/auth/schemas.ts`), que replica `ChangePasswordDto`: la actual hasta 50 caracteres y la nueva de 6 a 50. "Repetir" es solo del formulario: no viaja, porque el DTO rechaza campos de más. Cuando se entró con una temporal, "la actual" es esa contraseña temporal, y el campo lo aclara.
- **Requisitos (V5):** la tarjeta de requisitos del prototipo muestra solo las reglas que el DTO exige, "Entre 6 y 50 caracteres" y "Las dos contraseñas coinciden", y se tildan a medida que se cumplen. El prototipo pide además mayúscula, minúscula y número, pero eso es una regla de backend que no existe.
- **Contraseña actual incorrecta:** el backend responde 401 con `{ error: 'La contraseña actual es incorrecta' }`. Se muestra en el campo y **no cierra la sesión**, porque no es un 401 de guard (ver "Cierre automático"). Los demás errores, en un aviso arriba.

## Recuperar contraseña

- **Pantalla:** `/recuperar` (`src/features/auth/pages/RecoverPage.tsx`), con `recoverSchema` (`features/auth/schemas.ts`), que replica `RecoverPasswordDto`: el email, de hasta 50 caracteres. `useRecoverPassword()` hace `POST /users/recover-password` (real).
- **Mismo aviso exista o no el email (CU-U-04):** el backend responde 200 con el mismo mensaje en los dos casos y la pantalla ni lo lee: el modal "Revisá tu correo" dice siempre "Si *email* está registrado, te enviamos una contraseña temporal…". Así no hay forma de saber si el email existe. Cerrarlo con Escape o tocando el fondo vuelve al formulario con el email escrito; "Ir a iniciar sesión" lleva a `/login`.
- **Si falla el envío:** con un 5xx o sin conexión, un aviso rojo explica que no se pudo enviar, el botón pasa a "Reintentar" y el email queda escrito.
- **La contraseña temporal** tiene 10 caracteres entre letras y números (el prototipo dice "6 dígitos"), así que los textos no mencionan el largo. El login la acepta, porque está entre los 6 y los 50 caracteres que pide `LoginUserDto`.
- **El backend todavía no manda el email.** Genera la temporal y la imprime en su consola (`[EMAIL STUB] Contraseña temporal para …`): con el backend local, ahí se lee para probar el ingreso con ella.
- **Sin mock:** `POST /users/recover-password` es real.

## Estructura del proyecto

```
src/
  app/            router, providers, AppShell (tab bar y sidebar)
  api/            client.ts, coldStart.ts, errors.ts, queryClient.ts, queryKeys.ts, types.ts, openapi.json (bajado del Swagger), schema.d.ts y publicOperations.ts (generados), pending.ts
  mocks/          browser.ts, registry.ts, endpoint.ts, responses.ts, handlers/index.ts (los mocks de cada dominio van en handlers/<dominio>.ts)
  features/
    auth/         login, registro, recuperar y cambiar contraseña
    account/      Mi cuenta, compartida por los tres roles, y los hooks de datos de usuarios que usan varios roles
    catalog/      Ejercicios, músculos, circuitos, rutinas y planificaciones que leen varios roles (hooks; el buscador de ejercicios; de circuitos, rutinas y planificaciones, el listado y el editor); lo propio de cada rol vive en su feature
    user/         pantallas del rol Usuario
    coach/        pantallas del rol Entrenador
    admin/        pantallas del rol Admin
  shared/
    ui/           componentes base
    icons/        íconos SVG del prototipo como componentes
    lib/          formato de números, fechas y moneda; helpers
    styles/       tokens.css, global.css
public/           mockServiceWorker.js (el service worker de MSW, generado con npx msw init)
scripts/          fetch-openapi.mjs y gen-public-operations.mjs (lo que corren npm run api:fetch y npm run api:gen)
```

Cada feature organiza su código en `pages/`, `components/` y `hooks/`.

## Documentación

| Qué | Dónde |
|---|---|
| Lineamientos técnicos y reglas de dominio | [`CLAUDE.md`](CLAUDE.md) |
| Plan de implementación, tareas y estado | [`PLAN.md`](PLAN.md) |
| Contrato de la API (única fuente de los tipos) | `src/api/openapi.json`, bajado del Swagger del backend |
| Casos de uso (CU-U-xx, CU-E-xx, CU-A-xx) | [PowerApp-Docs](https://github.com/FranCarames/PowerApp-Docs): `Use Cases/` |
| Prototipo visual (layout, tokens, componentes y textos) | [PowerApp-Docs](https://github.com/FranCarames/PowerApp-Docs): `UI Front/powerapp-prototype-web.html` |

La documentación no se copia a este repo: se lee de PowerApp-Docs.

Si el prototipo contradice a un caso de uso o al contrato, mandan el caso de uso y el contrato.

## Flujo de trabajo

Cada tarea de `PLAN.md` es un PR:

1. Se crea la rama `feature/Txx-nombre` desde `develop`.
2. Se implementa solo el alcance de la tarea.
3. Se corren `typecheck`, `lint` y `build`.
4. En el mismo PR se marca la tarea como hecha en `PLAN.md`.
5. Fran revisa y mergea a `develop`.

Los releases van de `develop` a `main`, y Render despliega `main`.

## Deploy

Static Site en Render, desplegado desde `main`: https://powerapp-web.onrender.com. Cada push a `main` lo redespliega.

- **Build:** `npm ci && npm run build`
- **Publish:** `dist`
- **Rewrite:** `/*` a `/index.html`, con acción *Rewrite* (no *Redirect*), para que recargar una ruta interna no dé 404. Se carga en el servicio, pestaña *Redirects/Rewrites*.
- **Variables:** se cargan en la pestaña *Environment* del servicio.

| Variable | Valor en Render |
|---|---|
| `VITE_API_URL` | `https://powerapp-backend.onrender.com` |
| `VITE_USE_MOCKS` | No se define: T44 apagó todos los mocks y la variable se eliminó en Render el 24/10. Sin ella, el build no incluye MSW ni `mockServiceWorker.js`. |
| `NODE_VERSION` | `22` (Vite 8 pide Node 20.19 o 22.12 o más) |

Las variables `VITE_*` se leen al compilar: si las cambiás en Render hay que redesplegar (*Manual Deploy*), no alcanza con guardarlas.

El backend tiene que habilitar CORS para el dominio del front, con `Access-Control-Expose-Headers: Authorization`. Sin eso, el navegador no deja leer el token del login.

## Calendario

| Etapa | Fechas | Contenido |
|---|---|---|
| Semana 1 | 3 al 10/10 | Fundaciones, Auth y Mi cuenta. Desde el 5/10, Admin: navegación, panel, usuarios, ejercicios, catálogo, membresías y entrenadores |
| Semana 2 | 11 al 17/10 | Circuitos (Admin y Entrenador) y Entrenador con contrato existente |
| Semana 3 | 18 al 24/10 | Contratos nuevos, Usuario sin dependencias y núcleo del Usuario |
| Semana 4 | 25 al 31/10 | Historial de entrenamientos, paso a backend real y, si el backend ya está, el bloque C2 |
| Bloque C2 | Cuando el backend de rutinas y planificaciones esté completo (previsto antes del 31/10) | Rutinas y planificaciones para el Admin y el Entrenador, y asignaciones a alumnos |
| Debug | 1 al 20/11 | Pruebas manuales, corrección, documentación |
| Entrega final | 20/11 | — |

Las pruebas son manuales, con el checklist del apéndice A de [`PLAN.md`](PLAN.md). No hay tests automatizados.
