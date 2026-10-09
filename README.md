# PowerApp Web

Front web de **PowerApp**, una app de gestión de gimnasio con tres roles: **Usuario** (alumno), **Entrenador** y **Admin**. Consume la API REST de PowerApp (NestJS + TypeORM + PostgreSQL), desplegada en Render.

Es mobile-first: se usa sobre todo desde el celular en el gimnasio, y en escritorio se adapta.

> **Estado:** en desarrollo. Las tareas, su orden y su estado están en [`PLAN.md`](PLAN.md). Entrega final: **20/11/2026**.

## Qué hace cada rol

| Rol | Qué puede hacer | Tabs |
|---|---|---|
| **Usuario** | Ver su plan semanal y sus rutinas, marcar series, dejar notas, registrar y consultar sus RMs, calcular RMs potenciales, consultar la wiki de ejercicios, usar el temporizador y ver su historial de pagos. | Rutina, RMs, Timer, Perfil |
| **Entrenador** | Gestionar alumnos, circuitos, rutinas y planificaciones, asignarlas a los alumnos y controlar las membresías y los pagos. | Alumnos, Planes, Rutinas, Perfil |
| **Admin** | Administrar usuarios, ejercicios, circuitos, el catálogo (músculos y grupos musculares), los tipos de membresía y los entrenadores. Rutinas y planificaciones, cuando el backend esté completo. | Inicio, Usuarios, Ejercicios, Rutinas, Más |

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

3. Levantá el backend local en el puerto 3000, o activá los mocks con `VITE_USE_MOCKS=true`. Los mocks responden solo lo que el registry marca como mock; el resto sigue yendo al backend, así que para eso igual tiene que estar levantado.

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
| `VITE_USE_MOCKS` | `true` activa MSW para los endpoints marcados como mock en `src/mocks/registry.ts`. El resto va al backend real. |
| `API_PROXY_TARGET` | Solo del servidor de desarrollo (no llega al navegador). A dónde reenvía Vite las requests a `/api`. Por defecto, `http://localhost:3000`. |

## Backend y mocks

El backend lo desarrolla Fran por separado y **este repo nunca lo modifica**. Lo que todavía no está implementado o no tiene contrato se resuelve así:

- **Contrato existente, implementación pendiente:** el front usa mocks con MSW hasta que el backend lo implemente. Después se apagan en `src/mocks/registry.ts`.
- **Sin contrato:** los tipos provisionales viven en `src/api/pending.ts`, marcados con `// PENDIENTE-CONTRATO: <id> <CU>`. Cuando el contrato aparece en `openapi.json`, se borran, se regeneran los tipos y se ajusta el código.
- **Arranque en frío:** el backend corre en el free tier de Render y se duerme. Si una request tarda más de 4 segundos, el front muestra "Despertando el servidor, puede tardar un poco…".

### Cómo funcionan los mocks

Con `VITE_USE_MOCKS=true`, `main.tsx` arranca MSW (`src/mocks/browser.ts`) antes del primer render. MSW registra el service worker `public/mockServiceWorker.js`, que responde solo los endpoints marcados `mock: true` en el registry. Todo lo demás sigue su camino al backend real, con la misma URL base (`VITE_API_URL`, o el proxy de Vite si está vacía).

| Archivo | Qué es |
|---|---|
| `src/mocks/registry.ts` | Qué endpoints se mockean: método y path del contrato (si no existen en `openapi.json`, no compila) y `mock: true \| false`. Lo que no figura es real. |
| `src/mocks/handlers/<dominio>.ts` | Los mocks de cada dominio, con `mockEndpoint(método, path, resolver)`. El resolver recibe el body del request y los parámetros de ruta tipados con el contrato, y el compilador exige que devuelva lo que el contrato declara. |
| `src/mocks/fixtures/` | Datos de ejemplo en español, tipados con los tipos generados. |
| `src/mocks/responses.ts` | Los errores con los dos formatos del backend (`serviceError`: `{ error }`; `guardError`: `{ statusCode, message, error }`), la respuesta vacía y `authTokenHeaders`, el header `Authorization` con el que el login manda el token. |
| `src/mocks/endpoint.ts` | `mockEndpoint` y `mockPendingEndpoint`. |

- **Sumar un mock:** fixture en `fixtures/`, handler en `handlers/<dominio>.ts` (y en `handlers/index.ts`) y la entrada con `mock: true` en el registry. Si el registry y los handlers no coinciden, la consola avisa al arrancar.
- **Un endpoint sin contrato** (`PENDIENTE-CONTRATO`) se mockea con `mockPendingEndpoint` y una entrada con `pending: '<id>'` (el de la dependencia del PLAN) en el registry. Sus tipos van en `src/api/pending.ts`.
- **Apagar un mock** cuando el backend implementa el endpoint: `mock: false` en el registry. El handler queda.
- **Demora:** cada mock responde después de 100 a 400 ms, como un backend de verdad, para que se vean los estados de carga.
- **CORS:** los mocks no lo reproducen. La respuesta sale del service worker, así que el navegador deja leer `Authorization` aunque el backend real todavía no lo exponga (C1 de `PLAN.md`).
- **La variable se lee al compilar** y al arrancar `npm run dev`. Con `VITE_USE_MOCKS=false` (o sin definirla), el build no incluye MSW ni `mockServiceWorker.js`. Con `true` van los dos en `dist`, que es lo que necesita el deploy en Render.
- **`public/mockServiceWorker.js`** lo genera MSW y no se edita. Al actualizar `msw`, se regenera con `npx msw init` (el directorio ya está guardado en `package.json`).
- **MSW 3** pide Node 22.12 o más.

Las dependencias abiertas con el backend (B1 a B9, C1 a C3 y V1 a V9) están detalladas en la sección 4 de [`PLAN.md`](PLAN.md).

## Sesión, guards y arranque en frío

- **La sesión** (token y usuario) vive en `src/features/auth/sessionStore.ts`: en memoria y en `localStorage` (clave `powerapp.session`), que se lee una sola vez, al cargar la página. `useAuth()` la expone.
- **Cierre automático:** un 401 de guard en un request que llevaba token, o un 403 con "La cuenta está deshabilitada.", cierran la sesión, vacían el caché de TanStack Query y muestran un aviso; los guards llevan a `/login`. El 403 de "Permisos insuficientes" no la cierra, ni tampoco un 401 de negocio: el de un service (`{ error }`, sin `statusCode`), como "La contraseña actual es incorrecta" al cambiar la contraseña. Lo decide `isSessionExpiredError` (`src/api/errors.ts`), y ante un cuerpo que no reconoce toma el 401 como sesión muerta. Si la sesión cambió mientras el request estaba en vuelo (otro login, un cierre), su error no toca la sesión nueva.
- **Guards:** `RequireRole` (cada zona exige su rol; quien tiene otro vuelve a su inicio), `RequireSession` (`/cambiar-contrasena`) y `PublicRoute` (login, registro, recuperar y las direcciones que no existen).
- **Cambio de contraseña pendiente:** `session.passwordChangeRequired`, que marca el login (el campo de la respuesta es B9, todavía sin contrato). Con eso la única ruta permitida es `/cambiar-contrasena`, incluso después de recargar. `completePasswordChange()` libera el guard.
- **Arranque en frío:** si un request pasa de 4 segundos (`COLD_START_HINT_MS`, en `src/api/coldStart.ts`) sin que el backend conteste, aparece arriba "Despertando el servidor, puede tardar un poco…", sin cortar el request. Se va cuando el backend contesta (con lo que sea, menos 502, 503 o 504) o 3 segundos después del último request que falló sin respuesta, para que no parpadee mientras TanStack Query reintenta.
- **Para probarlo en desarrollo**, `/dev/api` tiene un probe que manda el token de la sesión a un endpoint protegido (con una cuenta de demo da 401 y cierra la sesión, porque su token es falso) y otro de respuesta lenta, que pide `/__dev/slow` (lo sirve Vite, solo en desarrollo, y anda solo con `VITE_API_URL` vacía).

## Navegación por rol

- **Dónde está:** `src/app/AppShell/navigation.ts`. `TAB_BAR` son las entradas de la tab bar de mobile y `SIDEBAR` los bloques de la barra lateral de desktop (desde 960 px), cada rol con las suyas. `Sidebar.tsx` y `TabBar.tsx` solo las dibujan.
- **Entrada marcada:** la de la ruta o la de cualquiera de sus `also` (incluido lo que cuelga de ella, `/c/alumnos/12`). En la barra lateral puede haber una por bloque, y la tab bar marca una sola (`activeTabOf`).
- **Entrenador:** la barra lateral tiene Membresías aparte, bajo "Organización". En mobile se entra desde el botón de la barra superior de Mis alumnos, y mientras tanto la tab Alumnos queda marcada.
- **Admin:** en desktop, tres bloques: Inicio, Usuarios y Entrenadores; "Entrenamiento" (Ejercicios, Circuitos, Rutinas y Planificaciones); y "Configuración" (Catálogo, Membresías y Perfil). En mobile, la tab bar tiene Inicio, Usuarios, Ejercicios, Rutinas y **Más** (`/a/mas`), una pantalla con los accesos que no entran: Planificaciones, Circuitos, Entrenadores, Catálogo, Membresías y Mi cuenta. Más es la entrada `fallback`: queda marcada en toda pantalla que no pertenece a otra tab, incluida Mi cuenta.
- **Rutinas y Planificaciones del Admin** (`/a/rutinas`, `/a/rutinas/:id`, `/a/planes`, `/a/planes/:id`) muestran `SectionPlaceholder` (`shared/ui`): "Esta sección se habilita cuando el backend de rutinas y planificaciones esté completo". Aparecen en la navegación como cualquier otra. Las reemplazan T21 a T24 en el bloque C2 del PLAN, y el Entrenador reutiliza el mismo componente en T48.
- **Pantallas temporales:** las rutas del Entrenador y del Usuario que todavía no tienen su tarea abren "Pantalla en construcción" con un comentario `TEMPORAL (Txx)`, para que ningún acceso caiga en "Página no encontrada". Las del Admin ya están todas, salvo Rutinas y Planificaciones, que muestran el placeholder del bloque C2.

## Panel del Admin

- **Pantalla** (`/a/inicio`, `src/features/admin/pages/DashboardPage.tsx`): cuatro tarjetas con cuántos hay de lo principal, cada una con un acceso a su sección, y "Gestión", con los accesos a Planificaciones, Entrenadores, Músculos, Grupos musculares y Membresías.
- **Números** (`useDashboardCounts`, seis queries independientes): Usuarios, el `total` de `GET /users/all` (todos los roles); Ejercicios, `GET /exercise/all`; Circuitos activos, `GET /routine/circuit/all`; Rutinas, `GET /routine/all`; y de apoyo, los planes sistémicos de `GET /planification/all` y los entrenadores con el registro de Coach activo (`Coach.active`) de `GET /coach/all`, que baja `delete_coach` y no `set-active`. Sin `include_inactive` el backend deja afuera lo dado de baja, así que los circuitos, rutinas y planes son los vigentes. Rutinas y Planificaciones llevan al placeholder hasta el bloque C2.
- **Catálogo:** "Músculos" y "Grupos musculares" abren `/a/catalogo` con `?seccion=musculos` o `?seccion=grupos`, para elegir el segmento.
- **Si algo no carga:** esa tarjeta muestra "–", el dato de apoyo vuelve al texto de la sección y aparece un aviso con "Reintentar", que pide solo lo que falló. Mientras carga, el número es un bloque gris.
- **Mocks:** con una cuenta de demo, cinco de los seis endpoints responden con datos de ejemplo (`src/mocks/fixtures/`); con una cuenta de verdad van todos al backend. Los circuitos activos (`GET /routine/circuit/all`) **ya no se mockean** (6/10): la cuenta de demo del Admin no puede entrar al panel, porque el backend rechaza su token falso y cierra la sesión. Los públicos (ejercicios y entrenadores) no llevan token, así que el mock mira la sesión (`demoAccountForSession`); los demás, el token falso (`staffAccess`).

## Usuarios del Admin

- **Pantalla** (`/a/usuarios`, `src/features/admin/pages/UsersPage.tsx`): los casos de uso CU-E-01 a CU-E-03 vistos desde el Admin. Contadores, buscador, chips y el listado paginado de `GET /users/all`. Tocar un usuario abre su detalle.
- **Contadores y chips:** Alumnos (`role=user`), Entrenadores (`role=coach`) e Inactivos (`active=false`, de todos los roles), con el `total` de cada uno; los chips son Todos, Alumnos, Entrenadores e Inactivos. Todos incluye las cuentas de admin. La búsqueda (nombre, apellido o email, con debounce) y el chip quedan en la URL (`?q=…&filtro=alumnos`), como en Mis alumnos.
- **Fila:** avatar (gris si la cuenta está inactiva, violeta si es entrenador), nombre, email, el rol y, si la cuenta está dada de baja, "Inactivo" y la fila apagada. En los alumnos, el email lleva "· membresía activa", "por vencer" o "vencida". Eso sale de `GET /membership/status/users` (cuatro requests, uno por estado, no uno por alumno); si no cargan, la fila no lo dice.
- **Detalle** (modal): el alumno, su email, su membresía (la del último pago) y, si el backend la responde, su planificación vigente. Hoy `GET /planification/user/{id}/active` no responde (el request cuelga), así que se corta a los 3,5 s y esa fila no aparece. El entrenador, su email profesional y su CUIL (`GET /coach/get/{id}`); el admin, su email.
- **Acciones:** "Convertir en entrenador" (alumno activo) abre `/a/convertir?alumno=<id>` (ver "Convertir alumno en entrenador del Admin"). "Editar datos", en el detalle de un entrenador, abre el modal de edición de Entrenadores. "Desactivar cuenta" pide confirmación (es una baja lógica: la cuenta no puede ingresar, pero se conservan sus datos) y "Reactivar cuenta" no. No se ofrece desactivar a un admin ni a la propia cuenta. Después de cada cambio se piden de nuevo los listados y los contadores, también los de Mis alumnos.
- **Mocks:** `GET /users/all`, `POST /users/set-active/{id}`, `GET /membership/status/users`, `GET /coach/get/{id}`, `GET /planification/user/{id}/active` y los pagos responden con datos de ejemplo a las cuentas de demo; las bajas viven en memoria.
- **Compartido con Mis alumnos:** los hooks de datos de usuarios (`useUsers`, `useUserCount`, `useSetUserActive`...) viven en `features/account/hooks`; el listado paginado, en `features/account/components/UserList.tsx`; y la búsqueda con chip en la URL, en `shared/lib/useSearchAndFilter.ts`.

## Ejercicios del Admin

- **Pantalla** (`/a/ejercicios`, `src/features/admin/pages/ExercisesPage.tsx`): el catálogo de ejercicios (CU-A-01 a CU-A-06). Buscador por nombre (sin mayúsculas ni acentos), chips por grupo muscular, y el botón flotante "Crear ejercicio". La búsqueda y el grupo quedan en la URL (`?q=…&grupo=<id>`).
- **Fila:** miniatura (la `preview_image`, o un ícono), nombre, los músculos en una línea y los botones Editar y Eliminar. Un ejercicio aparece en todos los grupos a los que pertenecen sus músculos.
- **Editor** (`/a/ejercicios/nuevo` y `/a/ejercicios/:id`, `ExerciseForm`): nombre, descripción, músculos como chips (✕ quita; "+ Agregar" abre un modal con los que faltan, por grupo), tips de seguridad y de activación, y tres links: video, imagen de vista previa e imagen de fondo (no hay endpoint de subida). Agregar y quitar músculos es mandar la lista completa en `exercised_muscles_ids`.
- **Datos opcionales:** el backend no deja vaciar un dato ya cargado (rechaza el texto vacío y, si el campo no viene, conserva el anterior), así que el formulario no lo permite y lo avisa.
- **Eliminar:** pide confirmación. El backend rechaza el borrado de un ejercicio con RMs o entrenamientos hechos con un `500` sin más motivo (V7): el front muestra un aviso con el motivo probable. Si el ejercicio solo está en circuitos, el backend lo borra y lo saca de ellos.
- **Cruce con los grupos:** `useExerciseCatalog` (`src/features/catalog/hooks`) junta `GET /exercise/all`, que trae los músculos de cada ejercicio, con `GET /muscles/mg/all`, que trae los de cada grupo. Ninguno de los dos campos está en el Swagger (V9): sus tipos están en `pending.ts`. Lo reutiliza la wiki del alumno (T28).
- **Mocks:** los seis endpoints (`GET /exercise/all`, `GET /exercise/{id}`, `POST /exercise/create`, `POST /exercise/edit/{id}`, `DELETE /exercise/{id}` y `GET /muscles/mg/all`) responden con datos de ejemplo a las cuentas de demo; los ejercicios viven en memoria. Press de banca y Sentadilla están "en uso": borrarlos da el rechazo del backend.

## Catálogo del Admin: músculos

- **Pantalla** (`/a/catalogo`, `src/features/admin/pages/CatalogPage.tsx`): los segmentos Músculos y Grupos musculares (`?seccion=musculos` o `?seccion=grupos`, que son los accesos del panel). Hay un solo buscador para los dos (`?q=…`).
- **Músculos** (CU-A-07 a CU-A-10, `MusclesSection`): lista con el ícono del color de su grupo, el nombre y el grupo; buscador por nombre sin acentos; botón flotante "Crear músculo"; Editar y Eliminar en cada fila.
- **Modal de alta y edición:** nombre, grupo muscular, y opcionales la descripción, una imagen y una vista previa (links: no hay endpoint de subida). Al editar, vaciar un dato que ya tenía valor manda `null` para borrarlo.
- **Eliminar:** pide confirmación y dice cuántos ejercicios lo usan. El backend no rechaza un músculo en uso: lo borra y lo quita de los ejercicios (cascada).
- **Datos:** `GET /muscles/all` (con el grupo anidado, distinto del contrato: V9) y `GET /muscles/mg/all` para el selector, más `POST /muscles/create`, `POST /muscles/edit/{id}` y `DELETE /muscles/{id}`. Con una cuenta de demo responden los mocks; los músculos viven en memoria y se ven también en Ejercicios.

## Catálogo del Admin: grupos musculares

- **Segmento** (`/a/catalogo?seccion=grupos`, `GroupsSection`): los casos de uso CU-A-11 a CU-A-15. La lista comparte el buscador con Músculos y muestra, por grupo, el ícono con el color del grupo, el nombre y cuántos músculos tiene. Botón flotante "Crear grupo muscular", y Editar y Eliminar en cada fila.
- **Detalle:** tocar un grupo abre un modal con sus músculos (CU-A-12). Salen de `GET /muscles/mg/all`, que trae los músculos de cada grupo (V9): no hace falta pedir cada grupo.
- **Modal de alta y edición:** nombre y, opcionales, dos links (imagen y vista previa). Al editar, vaciar un link que ya tenía valor manda `null` para borrarlo.
- **Eliminar:** el backend rechaza un grupo con músculos (con un `500` sin motivo), así que si el grupo tiene músculos el front no pide confirmación: explica que hay que moverlos o eliminarlos primero. Uno sin músculos pide confirmación.
- **Mocks:** `POST /muscles/mg/create`, `POST /muscles/mg/edit/{id}` y `DELETE /muscles/mg/{id}` responden con datos de ejemplo al Admin de demo; los grupos viven en memoria y se ven también en Músculos y en Ejercicios.

## Tipos de membresía del Admin

- **Pantalla** (`/a/membresias`, `src/features/admin/pages/MembershipTypesPage.tsx`): los casos de uso CU-A-20 a CU-A-23. Tarjetas con el nombre, la duración, cuántos alumnos tiene cada tipo y el precio en pesos; botón flotante "Crear membresía".
- **Activos e inactivos:** `GET /membership/all` trae todos los tipos. Los dados de baja se ven apagados, con "Inactiva", y en lugar de Eliminar tienen Reactivar (sin confirmación). Van después de los activos, y cada grupo de menor a mayor duración.
- **Alumnos por tipo:** salen de `GET /membership/type/users` (sin schema en el contrato: V1, tipado en `pending.ts`), que trae a todos los alumnos agrupados por el tipo de su último pago. Se pide una vez; si falla, las tarjetas no dicen la cantidad.
- **Modal de alta y edición:** nombre, precio (mayor a cero, hasta dos decimales) y duración (días enteros). Al editar, los cambios valen para los pagos nuevos: los ya registrados guardan su propia copia. El backend rechaza una duración que ya tiene otro tipo, y el modal lo avisa.
- **Eliminar:** es una baja lógica (`POST /membership/set-active/{id}`), con confirmación que lo aclara y dice que se puede reactivar.
- **Mocks:** `POST /membership/create`, `POST /membership/edit/{id}`, `POST /membership/set-active/{id}` y `GET /membership/type/users` responden con datos de ejemplo a las cuentas de demo; los tipos viven en memoria. Los alumnos de demo pagan distintos tipos, y sus pagos y su membresía lo reflejan.

## Entrenadores del Admin

- **Pantalla** (`/a/entrenadores`, `src/features/admin/pages/CoachesPage.tsx`): los casos de uso CU-A-16 y CU-A-19. El botón "Convertir alumno en entrenador" (lleva a `/a/convertir`, ver más abajo) y el listado: avatar, nombre, email profesional y "Activo" o "Inactivo", y el botón de Eliminar. No dice "N alumnos" como el prototipo, porque no hay vínculo entrenador-alumno. Editar abre un modal (ver más abajo); la fila de un usuario con el rol y sin registro de Coach no tiene el botón, porque no hay nada que editar.
- **Datos (V3):** `GET /coach/all` (público) trae solo el `Coach`, sin nombre, y `GET /users/all` no anida el coach. El listado cruza por id los usuarios con `role=coach` (todas las páginas, de 100 en 100) con `GET /coach/all`: son dos requests y, si falla uno, "Reintentar" repite solo ese (`useCoaches`). Un usuario con el rol pero sin registro de Coach (un alta que falló a la mitad) aparece con "Sin email profesional".
- **Estado:** "Inactivo" es una cuenta dada de baja (`User.active`, desde Usuarios) o un `Coach` inactivo. Los inactivos van al final y el resto por nombre.
- **Eliminar (CU-A-19):** `POST /coach/delete_coach/{id}` es una baja lógica del `Coach` (`active: false`) y, además, le devuelve a su usuario el rol `user`: deja de ser entrenador y vuelve a ser alumno, con la cuenta y los datos intactos (no toca `User.active`). Por eso sale de este listado y aparece en Alumnos; el panel y los contadores de Usuarios se actualizan. La confirmación lo aclara y dice que se lo puede volver a convertir. Para reactivarlo se lo convierte de nuevo (T36): `promote_user` reactiva su `Coach` anterior y pisa el email y el CUIL.
- **Sin rechazo por integridad (V7):** el backend no revisa dependencias ni borra filas, así que no hay un rechazo como en ejercicios, músculos o grupos. Los errores posibles son un 404 (el usuario o su `Coach` no existen) y un 500 genérico: se muestran con un aviso.
- **Editar (CU-A-18):** el botón de la fila y "Editar datos" en el detalle de un entrenador en Usuarios abren un modal (`CoachEditModal`) con el email profesional y el CUIL, los mismos campos y la misma máscara que Convertir (`coachDataSchema`, `CoachDataFields`), precargados con `GET /coach/get/{id}`. No se edita el nombre ni la cuenta: son del usuario, y CU-A-18 los deja fuera (el prototipo edita nombre y email). Avisa de un email que ya usa otro entrenador antes de mandarlo y, sin cambios, cierra sin pedir nada. **El endpoint no está en el contrato (B8)**: `POST /coach/edit/{id}` es una propuesta del front (`EditCoachRequest` en `pending.ts`) y hoy solo lo responde un mock, marcado como pendiente en el registry. Contra el backend real da un 404 de ruta y el modal avisa que todavía no está disponible.
- **Mocks:** `POST /coach/delete_coach/{id}` y `POST /coach/edit/{id}` responden con datos de ejemplo solo al Admin de demo (el entrenador recibe el 403 de un guard). Las bajas y las ediciones viven en memoria: el `Coach` dado de baja queda inactivo en `GET /coach/all` y el usuario pasa a Alumnos, como en el backend. Dar de baja a "Martín López" devuelve el 500, para ver el aviso.

## Convertir alumno en entrenador del Admin

- **Pantalla** (`/a/convertir`, `src/features/admin/pages/ConvertPage.tsx`): el caso de uso CU-A-17. El buscador y la lista de alumnos activos (`GET /users/all?role=user&active=true`, de a 20 con "Cargar más"), y debajo "Se convierte a …", el email profesional, el CUIL y el botón "Convertir en entrenador", apagado hasta elegir a alguien. Al terminar vuelve a Entrenadores con un aviso.
- **Elegido desde Usuarios:** `?alumno=<id>` (`GET /users/get/{id}`) deja al alumno elegido. Si no se lo puede convertir (ya es entrenador, es admin, tiene la cuenta inactiva o no existe), un aviso lo dice y no se elige.
- **Datos profesionales** (`coachDataSchema` y `CoachDataFields`, que reutiliza la edición de T37): el email (hasta 50 caracteres, se manda en minúsculas) y el CUIL, que se escribe con o sin guiones, se muestra con la máscara `27-12345678-4` al salir del campo y se envía de 11 dígitos sin guiones.
- **`POST /coach/promote_user`:** solo el Admin. Si el alumno ya fue entrenador, reactiva su registro y le pisa el email y el CUIL: el formulario arranca con los que tenía y un aviso lo explica. Es la forma de reactivar a un entrenador eliminado.
- **Email repetido:** el email profesional es único y el backend cambia el rol antes de guardar los datos, así que un repetido da un 500 que deja a la cuenta con el rol y sin datos. Por eso, antes de mandar, se compara con `GET /coach/all` y se avisa sin llamar al backend. Si igual falla, el aviso manda a revisar Entrenadores, el alumno sigue elegido y se puede reintentar con otro email.
- **Mocks:** `POST /coach/promote_user` responde con datos de ejemplo solo al Admin de demo (valida como el DTO, crea o reactiva, y reproduce el 500 del email repetido con el rol ya cambiado) y `GET /users/get/{id}` también responde por los alumnos y entrenadores de demo.

## Circuitos del Admin

- **Pantalla** (`/a/circuitos`, `src/features/admin/pages/CircuitsPage.tsx`, que monta `CircuitList`, de `src/features/catalog/components`, compartido con el Entrenador): el caso de uso CU-E-21. El aviso de que un circuito se usa en varias rutinas y los cambios valen para todas, el buscador (por nombre, sin acentos), los chips Activos, Inactivos y Todos y las tarjetas de a dos columnas desde 960 px. Un botón flotante abre `/a/circuitos/nuevo`. La búsqueda y el chip quedan en la URL (`?q=…&filtro=inactivos`).
- **Tarjeta** (`CircuitCard`): el nombre, el tipo y cuántos ejercicios tiene, en cuántas rutinas se usa (píldora "N rutinas") y los nombres de sus ejercicios, en orden. Un circuito dado de baja se ve apagado, con "Inactivo". Tocarla abre su editor (`/a/circuitos/:id`, ver más abajo), donde se lo da de baja o se lo reactiva. No muestra las series (como el prototipo) porque `all-plus` no las trae.
- **Datos:** `GET /routine/circuit/all-plus?include_inactive=true` (`useCircuits`, en `src/features/catalog/hooks`): una sola lista con los dados de baja incluidos, y los chips la filtran sin volver a pedirla. **En cuántas rutinas se usa** cada circuito no lo devuelve ningún endpoint: `useCircuitUsage` lo calcula con `GET /routine/all-plus` (solo las rutinas vigentes, y una rutina que repite el circuito cuenta una vez). Si ese pedido falla, las tarjetas no dicen la cantidad.
- **Sin mocks (6/10):** `GET /routine/circuit/all-plus` y `GET /routine/all-plus` van al backend real, que ya tiene los circuitos completos y probados. Las cuentas de demo no sirven para esta pantalla: el backend rechaza su token falso. Los handlers y las fixtures de `src/mocks/` quedan, apagados en el registry, hasta que T44 los borre.

## Editor de circuito del Admin

- **Pantalla** (`/a/circuitos/nuevo` y `/a/circuitos/:id`, `src/features/admin/pages/CircuitEditorPage.tsx`, que monta `CircuitEditor`, de `src/features/catalog/components`, compartido con el Entrenador): los casos de uso CU-E-22, CU-E-23 y CU-E-24. Nombre, tipo y descripción, los ejercicios en orden y, al editar, Duplicar y Desactivar o Reactivar. Guardar vuelve a la lista.
- **Ejercicios y series:** cada ejercicio se agrega con un selector (buscador por nombre y solo los que faltan: no se repiten) y se sube, baja o quita. Tiene su nota del entrenador y sus **bloques de series**, con todos los campos a la vista: series y repeticiones, peso, % del RM, intensidad (RPE o RIR, uno u otro), AMRAP con su tiempo y RM. Una fila es un bloque de series iguales (3 series de 8 repeticiones es un bloque) y se resume en una línea ("3×8 · 80 kg · RPE 7"). Las reglas son las de los DTOs: un RM exige una sola serie, el tiempo solo vale con AMRAP, y con AMRAP las repeticiones son el objetivo (1 es "sin objetivo").
- **Datos:** el detalle sale de `GET /routine/circuit/{id}` (`useCircuit`; el contrato declara el `exercise` de cada ejercicio como un objeto vacío, V2: tipo provisional en `pending.ts`). Alta y edición mandan el circuito completo (`POST /routine/circuit/create` y `edit/{id}`): el backend compara los ejercicios con los guardados y pisa la cabecera, así que lo que se omite (una descripción, una nota) se borra. Editar un circuito cambia todas las rutinas que lo usan; si lo usa más de una, un aviso las nombra y sugiere duplicarlo.
- **Duplicar, Desactivar y Reactivar:** Duplicar crea una copia de la versión guardada con "(copia)" y pasa a editarla. Desactivar (`POST /routine/circuit/set-active/{id}`) es una baja lógica, con confirmación: las rutinas que lo usan lo conservan. Un circuito dado de baja no se edita (el backend lo rechaza): sus campos se apagan hasta reactivarlo, y Reactivar no pide confirmación.
- **Sin mocks (6/10):** el detalle, el alta, la edición y la baja o reactivación van al backend real. Las cuentas de demo ya no sirven para esta pantalla (el backend rechaza su token falso). Los handlers y las fixtures quedan, apagados en el registry, hasta que T44 los borre.

## Circuitos del Entrenador

- **Acceso:** el tab Rutinas del Entrenador tiene dos segmentos, Rutinas y Circuitos (`RoutinesSegments`). Cada uno es una ruta: `/c/rutinas` y `/c/circuitos`, y el editor cuelga de la segunda (`/c/circuitos/nuevo` y `/c/circuitos/:id`). La tab queda marcada en todas.
- **Listado y editor:** son los mismos del Admin (ver "Circuitos del Admin" y "Editor de circuito del Admin"), que viven en `src/features/catalog/components` (`CircuitList` y `CircuitEditor`, con `CircuitCard`, `CircuitForm`, `CircuitExerciseCard`, `CircuitSetFields` y `ExercisePickerModal`). Cada rol los monta con su `basePath` (`/a/circuitos` o `/c/circuitos`): de ahí cuelga el editor y a ahí vuelven Guardar, Desactivar y "Volver". Sus páginas son `src/features/coach/pages/CircuitsPage.tsx` y `CircuitEditorPage.tsx`.
- **Rutinas y Planes:** el segmento Rutinas y `/c/planes` muestran el aviso de que se habilitan con el bloque C2 (`SectionPlaceholder`).
- **Sin mocks:** los endpoints son los mismos del Admin y van al backend real. Las cuentas de demo no sirven para este segmento: el backend rechaza su token falso y vuelven al login.

## Login

- **Pantalla:** `/login` (`src/features/auth/pages/LoginPage.tsx`). El formulario usa React Hook Form con el schema `loginSchema` (`features/auth/schemas.ts`), que replica `LoginUserDto`: email de hasta 50 caracteres y contraseña de 6 a 50. El resolver de Zod es propio (`shared/lib/zodResolver.ts`), porque `@hookform/resolvers` no está en el stack.
- **Llamada:** `useLogin()` hace `POST /users/login` (real) y arma la `Session`: el token sale del header `Authorization` de la respuesta y el usuario, del body. No abre la sesión: eso lo hace la pantalla con `signIn`, y después navega con `homePathFor(session)`. Si la respuesta no trae el token (con el backend real, falta C1), no se abre nada y se avisa.
- **Errores:** un 401 dice "El email o la contraseña no son correctos." (no aclara cuál falló) y un 403, "Tu cuenta está cerrada…". Para red, 400 y 5xx valen los textos de `getErrorMessage`. Tras un 401 se vacía la contraseña y el foco vuelve a ella.
- **Contraseña temporal (B9):** el contrato todavía no informa que se entró con una temporal. El front lee `password_change_required` de la respuesta (tipo provisional `LoginResponse` en `src/api/pending.ts`; el nombre es una propuesta que se ajusta cuando el contrato exista). Si es `true`, la sesión **no se abre**: aparece el modal bloqueante "Actualizá tu contraseña" y, recién al tocar su botón, se abre con `passwordChangeRequired` y se va a `/cambiar-contrasena`. Si se abriera antes, el guard de `PublicRoute` llevaría a esa pantalla sin que el modal llegue a verse.
- **Cuentas de demo (mocks):** con `VITE_USE_MOCKS=true`, `POST /users/login` está en el registry y responde las cuentas de `src/mocks/fixtures/users.ts`: una por rol, una con contraseña temporal y una cerrada. Todas comparten la misma contraseña, que está en ese archivo. Cualquier otro email pasa al backend real (`passthrough`), así que las cuentas de verdad entran igual. El token de las cuentas de demo es falso: sirven para recorrer pantallas con datos mockeados, y un endpoint real las rechaza con 401 y cierra la sesión. Las excepciones son cambiar la contraseña y leer y editar el propio usuario, que también se mockean para las cuentas de demo (ver abajo).

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
- **Mocks:** `GET /users/get/{id}` y `POST /users/edit` están en el registry y atienden solo a las cuentas de demo (por su id y su token falso); el resto va al backend (`passthrough`). Las ediciones viven en memoria y se pierden al recargar. `POST /users/logout` no se mockea.
- **Piezas que salieron de acá y se comparten:** `PhoneField` (`shared/ui`), usado por el registro y los datos personales; las reglas de cada campo de usuario (`shared/lib/userFields.ts`), que usan los schemas de auth y de cuenta; y `formatMonthYear` (`shared/lib/dates.ts`).

## Historial de pagos

- **Pantalla** (`/cuenta/pagos`, `src/features/account/pages/PaymentsPage.tsx`): es solo del rol Usuario (coach y admin que la abren a mano vuelven a su inicio, y su menú no la muestra). Lee `GET /membership/payment/user/{id}` (real), que el backend devuelve **sin ordenar**: la lista se ordena del pago más reciente al más antiguo, por la fecha en que se registró. Cada pago muestra el plan, cuándo se pagó, cuándo vence y el monto, que es una copia de lo que costaba ese día.
- **La membresía actual** sale del pago de **vencimiento más lejano**, no del más reciente por fecha: un trimestral pagado hace un mes manda sobre un mensual pagado ayer. Es la misma regla del backend (`shared/lib/membershipStatus.ts`).
- **El estado** se calcula con el `expired_at` de ese pago, no con el flag `active` del pago, que el backend actualiza una sola vez por día: **Activa** (verde), **Por vencer** (amarillo, desde 7 días antes, hasta el final de ese día) o **Vencida** (rojo; entonces la tarjeta dice "Última membresía" y "Venció"). El backend configura esa ventana con `MEMBERSHIP_EXPIRING_SOON_DAYS` y la informa en el resumen de membresías, pero ese endpoint es solo de entrenadores y admins, así que el alumno usa el valor por defecto (`EXPIRING_SOON_DAYS`).
- **Estados de la pantalla:** carga (esqueleto), error con reintento, y sin pagos ("Todavía no tenés pagos", sin tarjeta). Mi cuenta muestra el estado en una píldora bajo el nombre, con la misma query, así que los pagos se piden una sola vez; si no cargan, la píldora no se muestra y el historial tiene su propio error.
- **Formatos:** `formatDate` ("15 Jul 2026", en el día local de quien mira) y `formatPrice` ("$18.000", pesos argentinos con hasta dos decimales), en `shared/lib`.
- **Mocks:** `GET /membership/payment/user/{id}` atiende solo los ids de las cuentas de demo y el resto va al backend. Las fechas son relativas a hoy, para que el estado no dependa del día: la cuenta de Usuario tiene 4 pagos y su membresía vence en 15 días (activa), y la de contraseña temporal tiene 1 que vence en 3 (por vencer).

## Mis alumnos

- **Pantalla** (`/c/alumnos`, `src/features/coach/pages/StudentsPage.tsx`): el home del Entrenador. De arriba hacia abajo: el encabezado con el botón de Membresías y el avatar que lleva a Mi cuenta, los contadores, el buscador, los chips y el listado. Tocar una fila abre `/c/alumnos/:id`, el detalle del alumno (más abajo).
- **No hay vínculo entrenador-alumno:** "alumnos" son todos los usuarios con `role=user`. El listado es `GET /users/all?role=user` (real), de a 20, del alumno más nuevo al más viejo (así los ordena el backend). "Cargar más" pide la página siguiente, y si falla, la lista cargada se queda y el botón pasa a "Reintentar". Cada fila muestra la foto o la inicial, el nombre, el email y el estado de la cuenta (Activo o Inactivo, con el avatar gris). La adherencia y la última sesión del prototipo no van: no hay datos (T45).
- **Búsqueda** (CU-E-02): `keyword`, que el backend busca de forma parcial, sin distinguir mayúsculas, en nombre, apellido y email. Se manda 300 ms después de la última tecla, sin espacios en los bordes y hasta 100 caracteres (el límite del DTO). Mientras llega el resultado nuevo, la lista anterior queda a la vista, apagada.
- **Chips** Todos, Activos e Inactivos: el parámetro `active` (el estado de la cuenta, no el de la membresía).
- **Contadores** Activos, Inactivos y Total: el `total` de `GET /users/all?role=user&active=…&limit=1`, dos requests, y el total es su suma. Son de todos los alumnos y no cambian con la búsqueda ni con el chip. Si no cargan, muestran "–".
- **Botón de Membresías** (`/c/membresias`): el contador suma los alumnos con la membresía **por vencer o vencida** de `GET /membership/status/summary` (real, solo de entrenador y admin). Si el resumen no carga, el botón queda sin contador. El prototipo hace esa misma suma ("requieren atención").
- **La URL guarda la búsqueda y el chip** (`?q=ana&estado=inactivos`) y se leen solo al abrir la pantalla: volver del detalle con Atrás deja la lista como estaba. Cambiarlos no agrega entradas al historial.
- **Estados:** carga (esqueleto), error con reintento, y vacío en tres variantes: "Todavía no hay alumnos" (CU-E-01), "No hay alumnos activos" o "inactivos" (con el chip) y "No hay alumnos que coincidan con la búsqueda" (CU-E-02).
- **Mocks:** `GET /users/all` y `GET /membership/status/summary` atienden solo a las cuentas de demo (por su token falso) y el resto va al backend. El entrenador de demo ve 29 alumnos, 24 activos y 5 inactivos, con los nombres del prototipo, y 9 que requieren atención. `GET /users/all` filtra, ordena y pagina como el backend.
- **Piezas que se comparten:** `useDebouncedValue` (`shared/lib`) y `AccountLink` (`features/account`), el avatar de la barra superior, que va a usar también el home del Usuario.

## Detalle de alumno del Entrenador

- **Pantalla** (`/c/alumnos/:id`, `src/features/coach/pages/StudentDetailPage.tsx`): el encabezado (avatar de 64 px, el estado de la cuenta, Activo o Inactivo con el avatar gris, y "Alumno desde…"), una ficha con el email, la membresía y la planificación vigente, y el menú: RMs del alumno, Historial de entrenamientos, Historial de pagos y Registrar pago. Abajo, "Cerrar cuenta del alumno" (o "Reactivar cuenta" si está inactiva). La ficha es `StudentDetails` (`features/account/components`), la misma del detalle de usuario del Admin: la membresía sale del último pago y la planificación solo se muestra si el backend la responde. La adherencia, las sesiones y los meses del prototipo no van: no hay datos (T45).
- **Datos:** `GET /users/get/{id}` (real). Un id que no existe (404), que no es un UUID (400) o que es de un entrenador o un admin muestra "No encontramos al alumno", sin reintento: esta pantalla da de baja cuentas y no es para ellas. Cualquier otro error, con reintento.
- **RMs** (CU-E-04): un modal de solo lectura, porque los RMs los carga el propio alumno. `GET /user_rm/user/{id}` (real) trae los RMs de todos los ejercicios, sueltos y sin ordenar, cada uno con su ejercicio (`id` y `name`) y sin `exercise_id`, que es lo que declara el contrato (V10: `UserRmWithExercise`, en `pending.ts`). Se agrupan por ejercicio, en orden alfabético, y dentro de cada uno del más reciente al más antiguo, con el peso, las repeticiones y la fecha (`groupRmsByExercise`, en `shared/lib/rms.ts`). Se piden al abrir el modal, no al entrar. Con carga, error con reintento y "Todavía no registró RMs".
- **Historial de pagos** (CU-E-05): un modal con `GET /membership/payment/user/{id}` (real), que comparte la query con la ficha: se pide una sola vez. Va del pago más reciente al más antiguo (`newestPaymentsFirst`, el mismo orden del historial del Usuario) y cada uno muestra el plan, cuándo se pagó, cuándo vence y el monto. Con carga, error con reintento y "Todavía no tiene pagos".
- **Cerrar cuenta** (CU-E-03): `POST /users/set-active/{id}` con `{ "active": false }`. Pide confirmación, aclara que es una baja lógica (el alumno no puede ingresar, sus datos y sus pagos se conservan) y que se puede reactivar, y vuelve a Mis alumnos con "Cuenta cerrada". **Reactivar** manda `{ "active": true }` sin confirmación y deja la pantalla abierta, con "Cuenta reactivada". Después se piden de nuevo los listados y los contadores de usuarios. El backend no distingue roles al cambiar el estado: por eso la pantalla solo abre cuentas de alumnos.
- **Historial de entrenamientos** (CU-E-06 y CU-E-07): la fila dice "Próximamente" y no hace nada hasta T43.
- **Registrar pago** va a `/c/pago?alumno=<id>`, con el alumno elegido (ver "Registrar pago del Entrenador").
- **Fechas sin hora:** el `date` de un RM llega como "2026-10-01". JavaScript lo lee en UTC y en Argentina se vería un día antes, así que `formatDate` (`shared/lib/dates.ts`) muestra una fecha sin hora como el día de calendario que es. Las planificaciones también usan `date`.
- **Mocks:** `GET /user_rm/user/{id}` atiende solo a las cuentas de demo, por su token falso, y responde por cualquier alumno de demo (el usuario y los pagos ya tenían mock). Franco tiene RMs de cinco ejercicios, Lucía Gómez de dos y Martín Pérez ninguno; los demás tienen de uno a cinco, y algunos ninguno. Un id que el mock no conoce va al backend, y el token de demo recibe un 401: cierra la sesión, como en el resto de los mocks de demo.

## Control de membresías del Entrenador

- **Pantalla** (`/c/membresias`, `src/features/coach/pages/MembershipsPage.tsx`): se entra desde el botón de Membresías de Mis alumnos (o la barra lateral). De arriba hacia abajo: los contadores, "Registrar nuevo pago", el buscador, los chips de estado, el selector de tipo y la lista.
- **Contadores** (CU-E-26): `GET /membership/status/summary` (real, solo de entrenador y admin). Activas, Por vencer, Vencidas y Sin pagos; el prototipo tiene tres, "Sin pagos" se suma porque la API lo informa. Son de todos los alumnos, también de los de cuenta inactiva (así los cuenta el backend), y los filtros no los cambian. Si no cargan, muestran "–".
- **Lista** (CU-E-27 y CU-E-28): `GET /membership/status/users?status=…` (real; sin schema en el contrato, tipada en `pending.ts`, V1). Cada alumno trae el estado, el vencimiento y el tipo de su último pago. Con un chip se pide solo ese estado; con "Todas", los cuatro (uno por request, porque no hay un endpoint con el estado de cada alumno) y se juntan. Es todo o nada: si uno falla, error con reintento y no una lista que parezca completa. Ordena del vencimiento más viejo al más lejano y deja al final a quienes nunca pagaron.
- **Filtros:** el selector de **tipo de membresía** usa `GET /membership/all` (CU-E-25), con los tipos dados de baja marcados (un alumno puede tener un último pago de uno), y filtra por el tipo del último pago, que ya trae cada alumno (por eso no se pide `GET /membership/type/users`). La **búsqueda** es local, por nombre o email y sin acentos, porque el backend manda a todos sin paginar. La búsqueda y el chip quedan en la URL (`?q=…&estado=vencidas`), así que volver de registrar un pago deja la lista como estaba; el tipo no.
- **Cada alumno:** el avatar (gris si está vencida o sin pagos), el nombre, el tipo, la píldora de estado y "Vence" o "Venció" con la fecha y los días (`daysUntil` y `formatDaysUntil`, en `shared/lib/dates.ts`: "12 días", "hoy", "hace 3 días"). El botón es **Registrar pago**, o **Renovar** si ya venció, y abre `/c/pago?alumno=<id>`; "Registrar nuevo pago" abre `/c/pago` sin alumno.
- **Estados:** carga (esqueleto), error con reintento y vacío: "No hay alumnos en este estado", "Todavía no hay alumnos" o "Sin coincidencias" (con búsqueda o tipo elegido). Sin tipos de membresía, el selector queda deshabilitado con "Sin tipos de membresía".
- **Mocks:** no hay handlers nuevos. El vencimiento de cada alumno de demo sale de su último pago (`fixtures/payments.ts`), así que coincide con el historial del detalle y cambia de un alumno a otro.

## Registrar pago del Entrenador

- **Pantalla** (`/c/pago`, `src/features/coach/pages/RegisterPaymentPage.tsx`): se entra desde "Registrar nuevo pago" y "Registrar pago" o "Renovar" del control de membresías, y desde "Registrar pago" del detalle del alumno. Cubre altas y renovaciones: no existe "renovar" como operación aparte (CU-E-29).
- **Alumno:** con `?alumno=<id>` llega elegido (`GET /users/get/{id}`), como una fila con "Cambiar". Sin él, un buscador por nombre o email y la lista de alumnos de a páginas (`GET /users/all?role=user`), con los de cuenta inactiva marcados: el backend les deja registrar un pago. Si el id no existe, no es un UUID o es de un entrenador o un admin, un aviso lo dice y se puede elegir a otro. La pantalla arranca de nuevo si cambia el alumno de la URL.
- **Tipo de membresía:** `GET /membership/all`, solo los **activos** y de menor a mayor duración, porque el backend trae también los dados de baja y no valida `active` al registrar. Arranca en el tipo del último pago del alumno, si todavía se ofrece. Sin tipos activos, el selector queda apagado con un aviso.
- **Monto y fecha de pago** solo se muestran. La fecha no se elige: el backend no la recibe y usa el día del pago, así que va fija como "Hoy" (el prototipo tiene un campo de fecha).
- **Resumen:** el tipo, la vigencia ("hoy → hoy más la duración") y el total. Es una vista previa: el vencimiento lo calcula el backend, al final del día. **No suma lo que le quedaba al alumno:** con una membresía activa o por vencer, un aviso lo dice con su vencimiento (y si el pago nuevo vence antes que el actual, el actual sigue mandando).
- **Confirmar:** `POST /membership/payment/register` con solo `{ "user_id": …, "membership_id": … }` (real, `useRegisterPayment`). Después invalida `queryKeys.memberships.all`, muestra "Pago registrado · Nombre" y vuelve al control de membresías. Un error se muestra sobre el botón ("Ese tipo de membresía ya no existe", "El alumno ya no existe" o el aviso por defecto) y se va al elegir otro tipo. Un pago no se puede anular: el backend no tiene endpoint para eso.
- **Estados:** carga (esqueleto del alumno elegido y "Cargando…" en el selector), error de los tipos con reintento y todos los avisos de arriba.
- **Mocks:** `POST /membership/payment/register` atiende solo a las cuentas de demo. El pago queda en memoria y se ve en el historial del alumno, en el resumen, en las listas por estado y en el tipo del último pago, hasta recargar la página.

## Mis RMs del Usuario

- **Pantalla** (`/u/rms`, `src/features/user/pages/RmsPage.tsx`): se entra desde el tab RMs y desde Mi cuenta. De arriba hacia abajo: "Registrar RM" y "Calculadora", "Registrados" con la cantidad de ejercicios y los RMs agrupados por ejercicio (CU-U-17 a CU-U-20).
- **Lista** (CU-U-19): `GET /user_rm/user/{id}` con el id de la sesión (real, `useUserRms`; llega con la forma de V10, ver "Detalle de alumno del Entrenador"). Los ejercicios van en orden alfabético y, dentro de cada uno, del RM más reciente al más antiguo (`groupRmsByExercise`, en `shared/lib/rms.ts`). Cada fila muestra las repeticiones, la fecha y el peso, con los botones de editar y eliminar. Un ejercicio puede tener varios RMs: el contrato guarda peso, repeticiones y fecha de cada uno, y el prototipo (un solo RM por ejercicio) no. Sin RMs: "Todavía no registraste ningún RM".
- **Alta y edición** (CU-U-17 y CU-U-18): un modal (`RmFormModal`) con ejercicio, peso, repeticiones y fecha. `POST /user_rm/create` y `POST /user_rm/edit/{id}` (reales, `useSaveRm`) mandan además el `user_id` de la sesión, que el backend compara con el suyo. Los ejercicios salen de `GET /exercise/all` (público) y la fecha arranca en hoy. **Editar no cambia el ejercicio** (CU-U-18: peso, repeticiones o fecha): el campo queda apagado. Reglas del schema (`rmSchema`, en `features/user/schemas.ts`): peso de 1 kg o más (el DTO pide `@Min(0.99)`), hasta dos decimales y hasta 1.000 kg; repeticiones enteras de 1 a 100; fecha válida y no futura. Los topes de 1.000 kg y 100 repeticiones y lo de la fecha futura son del front, no del DTO.
- **La fecha viaja con el mediodía** (`2026-10-06T12:00:00`): el backend la lee con `new Date(date)` y toma el día con la zona horaria de su servidor, así que un día pelado (medianoche UTC) cae un día antes en un servidor al oeste de UTC, y cada edición lo corre otro más. En Render (UTC) no se nota; en un backend local en Argentina sí.
- **Eliminar** (CU-U-20): `DELETE /user_rm/{id}` (real, `useDeleteRm`), un borrado físico con confirmación ("No se puede deshacer"). Si el RM ya no existe (404), avisa y actualiza la lista; lo mismo pasa al editarlo.
- **Estados:** carga (esqueleto), error con reintento, vacío, y los errores del guardado dentro del modal (el ejercicio o el RM ya no existe, o el aviso por defecto).
- **Calculadora:** el botón abre `/u/calculadora` (ver "Calculadora de RM del Usuario").
- **Mocks:** la lista, el alta, la edición y la baja atienden solo a las cuentas de demo, por su token falso (`userAccess`, en `mocks/access.ts`); con un token de verdad van al backend. Lo que hace la cuenta de demo del Usuario queda en memoria hasta recargar y también lo ve el Entrenador en el detalle de ese alumno (`fixtures/userRms.ts`). Siguen las reglas del service: un usuario solo toca lo suyo (403), el ejercicio y el RM tienen que existir (404) y editar responde 201.

## Wiki de ejercicios del Usuario

- **Lista** (`/u/wiki`, `src/features/user/pages/WikiPage.tsx`): se entra desde Mi cuenta ("Biblioteca de ejercicios"), y la tab Rutina queda marcada. De arriba hacia abajo: "Biblioteca / Ejercicios", el buscador por nombre (sin mayúsculas ni acentos), los chips por grupo muscular y las filas (CU-U-15). Cada fila trae la miniatura (la `preview_image`, o un ícono), el nombre y los músculos en una línea, y abre la ficha. La búsqueda y el grupo quedan en la URL (`?q=…&grupo=<id>`).
- **Datos** (reales, solo lectura): `GET /exercise/all` (público) cruzado con `GET /muscles/mg/all` (`useExerciseCatalog`: cada ejercicio es de los grupos a los que pertenecen sus músculos, como en el listado del Admin) y `GET /exercise/{id}` para la ficha (pide sesión de cualquier rol, `useExercise`). El buscador y los chips son los mismos que los del Admin (`useExerciseSearch` y `ExerciseFilters`, en `src/features/catalog`).
- **Ficha** (`/u/wiki/:id`, `WikiExercisePage` y `ExerciseSheet`): el nombre, la cabecera del ejercicio (la imagen de fondo `bg_image` con un velo, la miniatura `preview_image` y los músculos que trabaja) y, solo si el ejercicio los tiene, la descripción, los tips de seguridad, los tips de activación y el video. El video es un link (`ButtonLink`, "Ver video") que se abre en otra pestaña. Una imagen que no carga no se muestra y un link que no es http o https no se abre (`isHttpUrl`, en `shared/lib/url.ts`): los links los carga el Admin como texto libre.
- **Abre al instante:** si la lista ya se cargó, la ficha muestra el ejercicio del caché del listado (`useExercise(id, { placeholderFromList: true })`) y lo confirma con `GET /exercise/{id}`. Con un link directo, muestra un esqueleto hasta que llega.
- **"Volver":** desde la lista va al plan (`/u/plan`, como el prototipo); desde la ficha vuelve a la lista con su búsqueda y su chip (la lista le pasa su `location.search` por el `state` de la navegación, `wikiState.ts`).
- **Estados:** carga (esqueleto), error con reintento, catálogo vacío, sin coincidencias ("No hay ejercicios con ese nombre. Probá con otra búsqueda o categoría.") y, en la ficha, "No encontramos el ejercicio" (404 o 400) sin reintento.
- **Mocks:** los ejercicios de demo son los de T31 (los mismos que ve el Admin, en memoria); Press de banca, Sentadilla y Peso muerto traen un video (una búsqueda en YouTube) y algunos traen tips. No hay imágenes de demo: los links de imagen se cargan desde el editor del Admin.

## Calculadora de RM del Usuario

- **Pantalla** (`/u/calculadora`, `src/features/user/pages/CalculatorPage.tsx`): se entra desde el botón Calculadora de Mis RMs, y la tab RMs queda marcada. De arriba hacia abajo: la explicación (con el aviso de que es una estimación y no se guarda en los RMs), el ejercicio, el peso y las repeticiones, la tarjeta del 1RM estimado y la tabla de 1RM a 12RM (CU-U-16).
- **El cálculo lo hace el backend** (`POST /user_rm/potential`, real, `usePotentialRms`): Epley, con el 1RM directo y la tabla de 1 a 12 repeticiones, sin guardar nada. El front no repite la cuenta. No hay botón: se calcula solo 400 ms después del último cambio, cuando los tres datos son válidos, como el prototipo (que calcula al escribir). Es una query (`queryKeys.rmPotential`) con `staleTime: Infinity`: el mismo ejercicio, peso y repeticiones dan el mismo resultado y vuelven del caché sin pedir de nuevo. Mientras se calcula otra cosa queda el resultado anterior, apagado; si un dato deja de ser válido, el resultado se vacía.
- **Campos** (`potentialRmSchema`, en `features/user/schemas.ts`): el ejercicio, que el endpoint pide aunque la cuenta no dependa de él (responde 404 si no existe); el peso, mayor a cero, con hasta dos decimales y hasta 1.000 kg; y las repeticiones, enteras de 1 a 100. Los avisos aparecen al escribir. Con más de 12 repeticiones, un aviso dice que la estimación pierde precisión (la tabla del backend llega a 12).
- **Resultado:** el 1RM con hasta dos decimales (los que calcula el backend) y la tabla con el porcentaje del 1RM, el peso y las repeticiones de cada fila. La fila de las repeticiones ingresadas muestra el mismo peso ingresado, con el peso en violeta. Los números no se redondean a enteros como en el prototipo, justamente para que esa fila coincida.
- **Estados:** "Calculando…" mientras llega el primer resultado, el cálculo anterior apagado mientras llega el siguiente, y los errores: el servidor, con reintento, y un ejercicio que ya no existe (404), sin reintento.
- **Mocks:** `POST /user_rm/potential` atiende solo a las cuentas de demo, por su token falso (cualquier rol), y hace la misma cuenta que el backend; con un token de verdad va al backend.

## Cambiar contraseña

- **Una pantalla, dos formas** (`/cambiar-contrasena`, `src/features/auth/pages/ChangePasswordPage.tsx`). El **obligatorio** es el de quien entró con una contraseña temporal (`session.passwordChangeRequired`): es la única pantalla que puede ver, dice "Paso 3 de 3", no tiene "Volver" y ofrece "Cerrar sesión" como salida. Al terminar llama a `completePasswordChange()`, que libera el guard, y va al inicio de su rol. El **voluntario** se abre desde Mi cuenta (T13 va a linkear acá), con "Volver" a `/cuenta`, y vuelve a ella.
- **Campos:** contraseña actual, nueva y repetir, con `changePasswordSchema` (`features/auth/schemas.ts`), que replica `ChangePasswordDto`: la actual hasta 50 caracteres y la nueva de 6 a 50. "Repetir" es solo del formulario: no viaja, porque el DTO rechaza campos de más. Cuando se entró con una temporal, "la actual" es esa contraseña temporal, y el campo lo aclara.
- **Requisitos (V5):** la tarjeta de requisitos del prototipo muestra solo las reglas que el DTO exige, "Entre 6 y 50 caracteres" y "Las dos contraseñas coinciden", y se tildan a medida que se cumplen. El prototipo pide además mayúscula, minúscula y número, pero eso es una regla de backend que no existe.
- **Contraseña actual incorrecta:** el backend responde 401 con `{ error: 'La contraseña actual es incorrecta' }`. Se muestra en el campo y **no cierra la sesión**, porque no es un 401 de guard (ver "Cierre automático"). Los demás errores, en un aviso arriba.
- **Cuentas de demo (mocks):** `POST /users/change-password` está en el registry y atiende solo los tokens de las cuentas de demo, para poder terminar el cambio obligatorio sin backend. El cambio vive en memoria: la contraseña vieja deja de servir y la cuenta con contraseña temporal deja de pedir el cambio, hasta que se recarga la página. Con un token de verdad, el request va al backend (`passthrough`).

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
  mocks/          browser.ts, registry.ts, endpoint.ts, responses.ts, handlers/<dominio>.ts, fixtures/
  features/
    auth/         login, registro, recuperar y cambiar contraseña
    account/      Mi cuenta, compartida por los tres roles, y los hooks de datos de usuarios que usan varios roles
    catalog/      Ejercicios, músculos y circuitos que leen varios roles (hooks y, de los ejercicios, el buscador); lo propio de cada rol vive en su feature
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
| `VITE_USE_MOCKS` | `true` hasta que T44 apague los mocks. Con `true` el build incluye MSW y `mockServiceWorker.js`; con `false`, ninguno de los dos. |
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
