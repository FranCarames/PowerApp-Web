# PowerApp Web: plan de implementación

Versión 1.1 · 3 de octubre de 2026. Las reglas técnicas y de dominio están en `CLAUDE.md`. Los casos de uso, el prototipo y el modelo de datos viven en el repo [PowerApp-Docs](https://github.com/FranCarames/PowerApp-Docs), que es la fuente de verdad de la documentación.

## 1. Objetivo y alcance

El objetivo es construir el front web de PowerApp para los tres roles, Usuario, Entrenador y Admin, en React + Vite + TypeScript, consumiendo la API existente y desplegado en Render como Static Site.

**Entra:**

- Las pantallas de los 75 casos de uso.
- El temporizador.
- La navegación por rol.
- Mocks para lo que el backend todavía no tiene.
- Deploy.

**No entra:**

- Desarrollo del backend, que hace Fran por separado (ver la sección 4).
- Tests automatizados. Las pruebas son manuales, con el checklist del apéndice A.
- Las pantallas sin caso de uso (Progreso, adherencia, última sesión y timer del Entrenador). Se hacen solo si sobra tiempo, en T45.

## 2. Calendario

| Etapa | Fechas | Contenido | Estimación |
|---|---|---|---|
| Semana 1 | 3 al 10/10 | Fundaciones, Auth, Mi cuenta | ~19 h |
| Semana 2 | 11 al 17/10 | Entrenador con contrato existente | ~19,5 h |
| Semana 3 | 18 al 24/10 | Contratos nuevos, Usuario sin dependencias, Admin | ~16 h |
| Semana 4 | 25 al 31/10 | Núcleo del Usuario, pendientes del Entrenador, paso a backend real | ~14,5 h, más extras |
| Debug | 1 al 20/11 | Pruebas manuales, corrección, documentación | — |
| Entrega final | 20/11 | — | — |

- **Dedicación disponible:** entre 10 y 20 h por semana, o sea entre 40 y 80 h en total. El plan suma unas 69 h sin los extras. Con 15 h por semana o menos no entra todo, y aplica la regla de recorte de la sección 3.
- **Estimaciones:** son orientativas e incluyen el trabajo de Claude Code y la revisión de Fran.

## 3. Prioridades y regla de recorte

- **Prioridad de roles:** 1. Usuario, 2. Entrenador, 3. Admin.
- **Orden de construcción:** por decisión de Fran, Admin se construye en la semana 3, antes del núcleo del Usuario (home semanal, detalle de rutina y ejecución), que depende de contratos nuevos.

**Regla de recorte (propuesta, a confirmar por Fran):**

1. **Primero se caen los extras sin caso de uso (T45).**
2. **Si al 24/10 Admin no está completo,** lo que falte se mueve después de la semana 4, para no demorar el núcleo del Usuario.
3. **Si la semana 4 se atrasa,** se respeta este orden: T38, T39, T40, T41, T42, T43, T44. Lo que no entre pasa a la primera semana de debug (1 al 7/11).

## 4. Dependencias del backend

### 4.1 Contratos que define Fran antes del 17/10

Para cada uno se indica qué necesita el front. El contrato lo diseña Fran. Hasta que llegue, el front trabaja con tipos provisionales en `src/api/pending.ts`.

| Id | Qué | CU | Qué necesita el front | Tareas |
|---|---|---|---|---|
| B1 | Rutinas del usuario por semana | CU-U-08 | Dado el usuario y una semana (número o fecha): datos del plan vigente (nombre, inicio, fin, semana actual y total), las rutinas de esa semana en orden con su estado (pendiente o hecha) y el id para abrir cada una. Tiene que cubrir el caso sin plan con rutina puntual y el caso sin asignaciones. | T38 |
| B2 | Detalle de rutina del usuario con estado de ejecución | CU-U-09, CU-U-10 | La estructura de `GET /routine/{id}`, más el estado de cada serie (realizada o no) y la nota del usuario por ejercicio, en el contexto de su asignación. | T39, T40 |
| B3 | Marcar y desmarcar serie | CU-U-12 | Identificar una serie individual dentro de un bloque: `set_count: 3` son 3 series marcables. Devuelve el estado nuevo. Hay un spec aprobado en PowerApp-Docs (`Doc/specs/2026-08-10-routine-exercise-set-finished-design.md`), pero marca por `exercise_set_id`, que hoy es un bloque, así que no resuelve las series individuales. | T40 |
| B4 | Nota del usuario en un ejercicio | CU-U-13 | Crear, editar y borrar el `user_note` de un ejercicio de su rutina. El mismo spec de B3 guarda la nota por serie y solo si está marcada, mientras que CU-U-13 la pide por ejercicio: hay que alinearlos. | T40 |
| B5 | Rutina puntual | CU-E-19, CU-E-20, CU-U-08 | Asignar una rutina a un alumno, quitarla y listar las de un alumno, tanto para el Entrenador como para el home. Error si ya está asignada. | T42, T38 |
| B6 | Historial de entrenamientos | CU-E-06, CU-E-07 | Rutinas ejecutadas por un alumno, con fecha. Filtro por ejercicio con peso, reps y fecha. | T43 |
| B7 | Asignar y editar la planificación de un alumno | CU-E-13, CU-E-14 | Body de `POST /planification/user/assign` y `/user/edit/{id}`: alumno, planificación, fechas y nota. Cómo se informa un solapamiento con un plan vigente y cómo se confirma igual. Qué id recibe `DELETE /planification/user/{id}` y si hace la baja lógica que pide CU-E-14. | T41 |
| B8 | Editar entrenador | CU-A-18 | Editar `coach_email` y `cuil`. | T37 |
| B9 | Flag de contraseña temporal | CU-U-02 | Un campo en la respuesta del login que indique cambio de contraseña obligatorio. | T09 (con mock), T44 |

### 4.2 Configuración y trabajo del backend

| Id | Qué | Para cuándo |
|---|---|---|
| C1 | CORS habilitado para el dominio del front en Render, con `Access-Control-Expose-Headers: Authorization`. Sin esto, el navegador no deja leer el token del login. En local no hace falta, porque el proxy de Vite lo resuelve. | T08 (semana 1) |
| C2 | Implementación del alta, la edición y la baja de rutinas y planificaciones. El contrato ya está definido; el front usa mocks hasta que estén. | Antes del 31/10 |
| C3 | Implementación de B1 a B9. | Antes del 31/10 |

### 4.3 Puntos a verificar contra el backend real

El contrato no los documenta del todo. Se resuelven en la tarea indicada.

| Id | Qué | Tarea |
|---|---|---|
| V1 | Forma de la respuesta de `GET /membership/status/users` y `GET /membership/type/users`, que no tienen schema. | T17 |
| V2 | `exercise` dentro de `CircuitExerciseResponseDto` es un objeto sin tipar. | T20, T39 |
| V3 | `GET /coach/all` devuelve el Coach sin nombre ni apellido. Hay que confirmar si `GET /users/all?role=coach` trae el coach anidado y sirve para el listado. | T35 |
| V4 | Que un usuario con `role=user` pueda leer `GET /routine/{id}` y `GET /exercise/{id}`. | T39 |
| V5 | El DTO pide contraseñas de 6 caracteres como mínimo. El prototipo muestra mínimo 8, con mayúscula y número. El front valida con el DTO; si se quieren las reglas del prototipo, hay que subirlas en el backend. | T10, T12 |
| V6 | El registro devuelve token, pero CU-U-01 pide volver al login. El front sigue el caso de uso. | T10 |
| V7 | Código y mensaje que devuelve el backend cuando rechaza un borrado por integridad (ejercicio, músculo, grupo o entrenador). | T31 a T35 |

## 5. Mapa de pantallas

Referencias de estado:

- **REAL:** el endpoint ya funciona.
- **MOCK:** el contrato existe pero falta la implementación.
- **PENDIENTE:** falta el contrato (sección 4.1).
- **CLIENTE:** no usa backend.
- **EXTRA:** solo si sobra tiempo.

Todos los paths llevan el prefijo `/api/v1`, que se omite en las tablas.

### Usuario

| Pantalla | CU | Endpoints | Estado |
|---|---|---|---|
| Login | CU-U-02 | `POST /users/login` | REAL (el flag de temporal es PENDIENTE, B9) |
| Registro | CU-U-01 | `POST /users/register` | REAL |
| Recuperar acceso | CU-U-04 | `POST /users/recover-password` | REAL |
| Nueva contraseña | CU-U-05 | `POST /users/change-password` | REAL |
| Mi cuenta y datos personales | CU-U-03, CU-U-06 | `GET /users/get/{id}`, `POST /users/edit`, `POST /users/logout` | REAL |
| Historial de pagos | CU-U-07 | `GET /membership/payment/user/{id}` | REAL |
| Mis RMs | CU-U-17 a CU-U-20 | `GET /user_rm/user/{id}`, `POST /user_rm/create`, `POST /user_rm/edit/{id}`, `DELETE /user_rm/{id}`, `GET /exercise/all` | REAL |
| Calculadora RM | CU-U-16 | `POST /user_rm/potential` | REAL |
| Wiki de ejercicios | CU-U-15 | `GET /exercise/all`, `GET /exercise/{id}`, `GET /exercise/ExMuscles/all`, `GET /muscles/all`, `GET /muscles/mg/all` | REAL |
| Temporizador | CU-U-14 | — | CLIENTE |
| Home (Tu plan) | CU-U-08 | `GET /planification/user/{id}/active`, B1, B5 | PENDIENTE |
| Detalle de rutina | CU-U-09 | `GET /routine/{id}`, B2 | REAL para la estructura, PENDIENTE para el estado |
| Detalle de ejercicio | CU-U-10 a CU-U-13 | B2, B3, B4, `GET /user_rm/user/{idUser}/exercise/{idExercise}` | PENDIENTE (los RMs son REAL) |
| Progreso | sin CU | — | EXTRA |

### Entrenador

| Pantalla | CU | Endpoints | Estado |
|---|---|---|---|
| Mis alumnos | CU-E-01, CU-E-02 | `GET /users/all?role=user`, `GET /membership/status/summary` (badge) | REAL |
| Detalle de alumno | CU-E-03 a CU-E-07 | `GET /users/get/{id}`, `POST /users/set-active/{id}`, `GET /user_rm/user/{id}`, `GET /membership/payment/user/{id}`, B6 | REAL (el historial es PENDIENTE, B6) |
| Membresías (control) | CU-E-25 a CU-E-28 | `GET /membership/all`, `GET /membership/status/summary`, `GET /membership/status/users`, `GET /membership/type/users` | REAL |
| Registrar pago | CU-E-29 | `POST /membership/payment/register` | REAL |
| Circuitos (segmento de Rutinas) | CU-E-21, CU-E-24 | `GET /routine/circuit/all-plus`, `POST /routine/circuit/set-active/{id}` | REAL |
| Editor de circuito | CU-E-22, CU-E-23 | `GET /routine/circuit/{id}`, `POST /routine/circuit/create`, `POST /routine/circuit/edit/{id}`, `GET /exercise/all` | REAL |
| Rutinas | CU-E-15, CU-E-18 | `GET /routine/all-plus`, `POST /routine/set-active/{id}` | Lectura REAL, escritura MOCK |
| Editor de rutina | CU-E-16, CU-E-17 | `GET /routine/{id}`, `POST /routine/create`, `POST /routine/edit/{id}`, `GET /routine/circuit/all-plus` | Lectura REAL, escritura MOCK |
| Planificaciones | CU-E-08, CU-E-11 | `GET /planification/all`, `POST /planification/set-active/{id}` | Lectura REAL, escritura MOCK |
| Editor de planificación | CU-E-09, CU-E-10, CU-E-12a a CU-E-12d | `GET /planification/{id}`, `POST /planification/create`, `POST /planification/edit/{id}`, `POST /planification/routine/assign`, `POST /planification/routine/assign-bulk`, `POST /planification/routine/set-active/{id}`, `POST /planification/routine/set-active-bulk`, `GET /routine/all` | Lectura REAL, escritura MOCK |
| Asignar planificación a alumno | CU-E-13, CU-E-14 | `POST /planification/user/assign`, `POST /planification/user/edit/{id}`, `GET` y `DELETE /planification/user/{id}` | PENDIENTE (B7) |
| Asignar rutina a alumno | CU-E-19, CU-E-20 | B5 | PENDIENTE |
| Timer del Entrenador | sin CU | — | EXTRA |
| Mi cuenta | reutiliza CU-U-05 y CU-U-06 | Los mismos que Usuario | REAL |

### Admin

| Pantalla | CU | Endpoints | Estado |
|---|---|---|---|
| Panel | conteos | `GET /exercise/all`, `GET /muscles/all`, `GET /muscles/mg/all`, `GET /coach/all` | REAL |
| Catálogo: ejercicios | CU-A-01 a CU-A-06 | `GET /exercise/all`, `GET /exercise/{id}`, `GET /exercise/ExMuscles/all`, `POST /exercise/create`, `POST /exercise/edit/{id}`, `DELETE /exercise/{id}`, `GET /muscles/all` | REAL |
| Catálogo: músculos | CU-A-07 a CU-A-10 | `GET /muscles/all`, `GET /muscles/get/{id}`, `POST /muscles/create`, `POST /muscles/edit/{id}`, `DELETE /muscles/{id}`, `GET /muscles/mg/all` | REAL |
| Catálogo: grupos musculares | CU-A-11 a CU-A-15 | `GET /muscles/mg/all`, `GET /muscles/mg/get/{id}`, `POST /muscles/mg/create`, `POST /muscles/mg/edit/{id}`, `DELETE /muscles/mg/{id}`. Los músculos del grupo se filtran de `/muscles/all`. | REAL |
| Membresías (tipos) | CU-A-20 a CU-A-23 | `GET /membership/all`, `POST /membership/create`, `POST /membership/edit/{id}`, `POST /membership/set-active/{id}` | REAL |
| Entrenadores | CU-A-16, CU-A-19 | `GET /coach/all`, `POST /coach/delete_coach/{id}` | REAL (ver V3) |
| Convertir alumno | CU-A-17 | `GET /users/all?role=user`, `POST /coach/promote_user` | REAL |
| Editar entrenador | CU-A-18 | B8 | PENDIENTE |
| Mi cuenta | reutiliza CU-U-05 y CU-U-06 | Los mismos que Usuario | REAL |

## 6. Tareas

Cada tarea es un PR, con una rama `feature/Txx-...` desde `develop`. Claude Code marca el checkbox al terminarla. El flujo completo está en `CLAUDE.md`.

### Semana 1 (3 al 10/10): fundaciones, Auth y Mi cuenta

- [x] **T01 · Repo y scaffolding (1,5 h)**
  - Crear el repo `powerapp-web` (nombre a confirmar) con las ramas `main` y `develop`.
  - Vite + React + TypeScript estricto, ESLint y Prettier, la estructura de carpetas y los scripts de `CLAUDE.md`.
  - Guardar el JSON del Swagger en `src/api/openapi.json`. La documentación no se copia: se lee de PowerApp-Docs.
  - Agregar `CLAUDE.md` y este `PLAN.md` en la raíz.
  - Listo cuando: `npm run dev` levanta una página vacía, y `typecheck`, `lint` y `build` pasan.
- [x] **T02 · Estilos globales (1 h)**
  - `tokens.css` copiado exacto del prototipo.
  - `global.css` con reset, foco visible, reduced motion y safe areas.
  - Google Fonts con preconnect, `viewport-fit=cover` y `theme-color`.
  - Listo cuando: una página de prueba muestra las tipografías y los colores igual que el prototipo.
- [x] **T03 · Componentes base (3 h)**
  - Componentes:
    - Button (variantes pri, sec, ghost, danger y sm).
    - Field con Input, PasswordInput (mostrar y ocultar), Select y Textarea, todos con estado de error.
    - Card, Pill, Chip, SearchInput y Segmented.
    - Modal (bottom sheet en mobile, diálogo en desktop, con bloqueo opcional) y ConfirmDialog.
    - Toast, EmptyState, Spinner y Skeleton.
    - Stat, FiberBar, Fab y Avatar.
    - Íconos del prototipo como componentes.
    - Piezas que el prototipo repite en casi todas las pantallas (PR de seguimiento): IconButton y LinkButton, Tile y Thumb, Note, SectionHeader, List, ListItem y Columns, ListSkeleton y ErrorState, y VisuallyHidden.
  - Una página `/dev/ui`, solo en desarrollo, para verlos todos.
  - Listo cuando: todos se ven bien en `/dev/ui`, en mobile y en desktop.
- [x] **T04 · AppShell y navegación por rol (2 h)**
  - Tab bar inferior en mobile y sidebar desde 960 px.
  - Tabs por rol según `CLAUDE.md`.
  - PageHeader con eyebrow, título, acciones y "Volver".
  - Layout de las pantallas de auth.
  - Listo cuando: con un usuario mock se puede navegar entre tabs vacíos de cada rol.
  - Para poder cumplirlo, T04 dejó un `AuthProvider` mínimo, el guard `RequireRole` y una sesión de prueba en `/login` (`features/auth`). Cada pantalla vacía lleva el comentario `TEMPORAL (Txx)` con la tarea que la reemplaza.
- [x] **T05 · Capa de API (1,5 h)**
  - Scripts `api:fetch` y `api:gen`. El primero venía de T01; `api:gen` ahora también genera `src/api/publicOperations.ts`, con los endpoints que no piden token.
  - Cliente `fetch` tipado: URL base, Bearer, parseo de errores y captura del header `Authorization`.
  - QueryClient, proxy de Vite a `localhost:3000` y `.env.example`.
  - Listo cuando: un hook de prueba lista `GET /membership/all` contra el backend local. El hook está en `src/app/dev` y se ve en `/dev/api`, que además prueba un 404 y un 401.
  - Falta para T07: el cliente ya llama a `onUnauthorized` ante un 401 de un request con token, pero nadie lo conecta todavía.
- [x] **T06 · Mocks con MSW (1,5 h)**
  - Registry por endpoint, handlers por dominio, fixtures tipadas y `pending.ts`.
  - Activación con `VITE_USE_MOCKS`, también en el build de Render.
  - Listo cuando: con mocks activados, `/membership/all` responde el fixture; desactivados, responde el backend.
  - Cómo se suma un mock, para las tareas que siguen: fixture en `src/mocks/fixtures/`, handler con `mockEndpoint` en `src/mocks/handlers/<dominio>.ts` (y en `handlers/index.ts`) y la entrada con `mock: true` en `registry.ts`. T44 apaga los mocks pasando esa entrada a `mock: false`. Está explicado en el README, sección "Backend y mocks".
  - `pending.ts` trae solo B7 y B8, cuyos campos salen de entidades del contrato. B1 a B6 y B9 los tipa la tarea que los usa.
  - Con `VITE_USE_MOCKS=false` el build no incluye MSW ni su worker; con `true`, sí.
- [x] **T07 · Sesión, guards y arranque en frío (1,5 h)**
  - AuthProvider con token y usuario en `localStorage` (la base ya está desde T04).
  - Rutas protegidas por rol, redirección al home de cada rol y guard de cambio de contraseña pendiente (`RequireRole` ya existe desde T04, sin el guard de contraseña).
  - Ante un 401, se cierra la sesión. Se conecta con `configureApi({ onUnauthorized })` (el cliente solo lo llama si el request llevaba token). El 403 con "La cuenta está deshabilitada." también cierra la sesión y el de permisos no; `ApiError.serverMessage` trae el texto para distinguirlos.
  - Aviso de "despertando el servidor" a los 4 segundos de espera.
  - Listo cuando: un usuario mock de cada rol entra a su home y no puede abrir rutas de otro rol.
  - Cómo quedó: la sesión vive en `sessionStore.ts` (fuera de React) y `AuthProvider` se suscribe; el cliente cierra la sesión por un 401 o por el 403 de cuenta deshabilitada, siempre que la sesión no haya cambiado mientras el request volaba. `Session.passwordChangeRequired` es la bandera del cliente del cambio pendiente. Está explicado en el README, sección "Sesión, guards y arranque en frío".
  - Para las tareas que siguen: T09 tiene que guardar la bandera con el campo de B9 (`signIn({ token, user, passwordChangeRequired })`) y navegar con `homePathFor(session)`. T12 llama a `completePasswordChange()` al terminar el cambio obligatorio. T13 usa `signOut()`, que cierra la sesión local; el `POST /users/logout` y el aviso en el login de por qué se cerró quedan para ellas.
  - Provisorio: el botón "Entrar con contraseña temporal" de `/login` y los de prueba de `/cambiar-contrasena` (T09 y T12 los reemplazan).
- [x] **T08 · Deploy en Render (1 h)**
  - Static Site desde `main`: build `npm ci && npm run build`, publish `dist`.
  - Rewrite de `/*` a `/index.html`.
  - Variables `VITE_API_URL` y `VITE_USE_MOCKS`.
  - Requiere C1.
  - Listo cuando: la URL de Render abre el login y recargar una ruta interna no da 404.
  - Cómo quedó: el sitio es `powerapp-web` y está en https://powerapp-web.onrender.com. Se redespliega solo con cada push a `main`. La configuración está en el README, sección "Deploy". Variables: `VITE_API_URL=https://powerapp-backend.onrender.com`, `VITE_USE_MOCKS=true` (los mocks siguen prendidos hasta T44) y `NODE_VERSION=22`.
  - Verificado en el sitio real: `/login` abre con los assets en 200 y MSW activo; recargar `/u/plan` mantiene la sesión y la pantalla; con sesión de Usuario, `/c/alumnos` vuelve a `/u/plan`; sin sesión, `/a/inicio` va a `/login`; una ruta inexistente muestra "Página no encontrada". Ninguna da 404 del servidor.
  - Pendiente: C1. El backend de Render no respondió a un preflight de prueba (25 s), así que no se pudo comprobar. No bloquea esta tarea, porque el sitio con mocks no necesita CORS, pero el login contra el backend real desde el sitio desplegado no puede leer el token hasta que C1 esté. Cuando exista, probar con `OPTIONS` desde el origen `https://powerapp-web.onrender.com` y mirar que `Access-Control-Expose-Headers` incluya `Authorization`.
  - Para las tareas que siguen: las variables `VITE_*` se incrustan al compilar. Si se cambian en Render hay que redesplegar (Manual Deploy), no alcanza con guardarlas. T44 apaga los mocks con `mock: false` en el registry y pasa `VITE_USE_MOCKS` a `false` en Render.
- [ ] **T09 · Login (1 h) · CU-U-02**
  - Email y contraseña, con las validaciones de `LoginUserDto`.
  - Credenciales inválidas: error genérico. Cuenta inactiva (403): mensaje específico.
  - Redirección según el rol.
  - Si el flag de B9 (con mock hasta que exista) indica contraseña temporal, se abre un modal bloqueante "Actualizá tu contraseña" que lleva a `/cambiar-contrasena`.
  - Links a registro y a recuperar.
- [ ] **T10 · Registro (1 h) · CU-U-01**
  - Campos de `CreateUserDto`: nombre, apellido, email, prefijo, teléfono y contraseña. Siempre con `role: user`.
  - Email ya registrado: mensaje con links a login y a recuperar.
  - Después del alta, vuelve al login (V5, V6).
- [ ] **T11 · Recuperar contraseña (0,5 h) · CU-U-04**
  - Envía el email a `POST /users/recover-password`.
  - El modal de confirmación muestra el mismo mensaje exista o no el email.
  - Si falla el envío, permite reintentar.
- [ ] **T12 · Cambiar contraseña (1 h) · CU-U-05**
  - Voluntario: desde Mi cuenta, con contraseña actual, nueva y repetir.
  - Obligatorio: después de entrar con la temporal; la "actual" es la temporal.
  - Un 401 se muestra como "La contraseña actual es incorrecta".
  - Al terminar el cambio obligatorio, se libera el guard y se va al home.
- [ ] **T13 · Mi cuenta, datos personales y cerrar sesión (1,5 h) · CU-U-06, CU-U-03**
  - Menú de cuenta compartido por los tres roles.
  - Datos personales precargados con `GET /users/get/{id}` y guardados con `POST /users/edit`. Un 409 se muestra como "El email ya está en uso". Al guardar, se actualiza el usuario de la sesión. La foto de perfil va como URL.
  - Cerrar sesión: `POST /users/logout` y limpieza de la sesión. Aunque el request falle, la sesión se cierra igual.
- [ ] **T14 · Historial de pagos del usuario (1 h) · CU-U-07**
  - Pagos ordenados por fecha descendente, con su `expired_at`.
  - Tarjeta con la membresía actual y su estado, según el último pago.
  - Estado vacío.

### Semana 2 (11 al 17/10): Entrenador con contrato existente

- [ ] **T15 · Mis alumnos (2 h) · CU-E-01, CU-E-02**
  - Listado paginado (cargar más) con búsqueda por `keyword` y debounce.
  - Chips Todos, Activos e Inactivos con el parámetro `active`, y sus contadores.
  - Botón de Membresías con badge de "por vencer", desde el summary.
  - Sin adherencia ni última sesión (eso es T45).
- [ ] **T16 · Detalle de alumno (1,5 h) · CU-E-03, CU-E-04, CU-E-05**
  - Datos del alumno.
  - RMs agrupados por ejercicio en un modal; los nombres salen de `/exercise/all`.
  - Historial de pagos en un modal.
  - "Registrar pago" abre T18 con el alumno preseleccionado.
  - Cerrar cuenta con confirmación, o reactivar si está inactiva.
  - El historial de entrenamientos queda como "Próximamente" hasta T43.
- [ ] **T17 · Control de membresías (2 h) · CU-E-25 a CU-E-28**
  - Contadores del summary: activas, por vencer, vencidas y sin pagos. El prototipo tiene tres estados; se suma "Sin pagos", que existe en la API.
  - Filtro por estado y por tipo de membresía, y búsqueda local.
  - Acción de registrar pago o renovar.
  - Resolver V1.
- [ ] **T18 · Registrar pago (1 h) · CU-E-29**
  - Elegir alumno (o venir preseleccionado) y un tipo de membresía activo.
  - Resumen con precio y vigencia estimada, solo visual; el vencimiento real lo calcula el backend.
  - Al confirmar, se invalidan el summary, las listas y los pagos del alumno.
- [ ] **T19 · Circuitos: listado y baja (1 h) · CU-E-21, CU-E-24**
  - Segmento Circuitos dentro del tab Rutinas.
  - Tarjetas con sus ejercicios (`all-plus`), búsqueda, filtro por tipo e "incluir inactivos".
  - Baja lógica con confirmación, y reactivar.
- [ ] **T20 · Editor de circuito (4 h) · CU-E-22, CU-E-23**
  - Nombre, tipo y descripción.
  - Ejercicios en orden: agregar desde el catálogo con buscador, quitar y reordenar. Un ejercicio no se repite.
  - Por cada ejercicio, nota del coach y bloques de series con todos los campos a la vista (series, reps, peso, RPE o RIR, % de RM, AMRAP con tiempo y RM), con las validaciones de `CLAUDE.md`.
  - Al editar, avisar que el cambio afecta a todas las rutinas que usan el circuito.
  - Escritura real. Resolver V2.
- [ ] **T21 · Rutinas: listado y baja (1 h) · CU-E-15, CU-E-18**
  - Segmento Rutinas, con los circuitos de cada una (`all-plus`), búsqueda e "incluir inactivas".
  - Baja con confirmación, avisando que la rutina sigue en las asignaciones vigentes, y reactivar.
  - Escritura MOCK.
- [ ] **T22 · Editor de rutina (2,5 h) · CU-E-16, CU-E-17**
  - Nombre y nota del coach.
  - Circuitos existentes en orden: elegirlos de la lista de circuitos (solo activos para agregar), repetirlos, reordenarlos y quitarlos. Mínimo 1, máximo 50.
  - Payload de edición con los ids de vínculo (reconciliación).
  - Reemplaza al editor del prototipo, que creaba los circuitos adentro de la rutina.
  - Escritura MOCK.
- [ ] **T23 · Planificaciones: listado y baja (1 h) · CU-E-08, CU-E-11**
  - Búsqueda, filtro por tipo e "incluir inactivas".
  - Cada tarjeta muestra la meta y lo asignado (`number_of_routines` y `routine_count`).
  - Baja con aviso de que no se quita a los alumnos que la tienen, y reactivar.
  - Escritura MOCK.
- [ ] **T24 · Editor de planificación (3,5 h) · CU-E-09, CU-E-10, CU-E-12a a CU-E-12d**
  - Datos: nombre, número de rutinas, descripción, tipo y duración.
  - Rutinas del plan en orden, con su id de asignación.
  - Agregar una rutina (con posición opcional) o varias en lote.
  - Quitar o reincorporar una o varias, con posición opcional al reincorporar.
  - Si el plan está inactivo, se bloquean los cambios de contenido con un aviso.
  - Escritura MOCK. La asignación a alumnos, que en el prototipo estaba acá, va en T41.

### Semana 3 (18 al 24/10): contratos nuevos, Usuario sin dependencias y Admin

- [ ] **T25 · Incorporar los contratos nuevos (1,5 h)**
  - Correr `api:fetch` y `api:gen` con B1 a B9.
  - Reemplazar los provisionales de `pending.ts` por los tipos generados y actualizar los handlers de MSW.
  - Listo cuando: no queda ningún tipo `PENDIENTE-CONTRATO` de B1 a B9. Los que no hayan llegado se listan en el PR.
- [ ] **T26 · Mis RMs (2 h) · CU-U-17 a CU-U-20**
  - RMs agrupados por ejercicio y fecha.
  - Alta y edición en un modal: ejercicio, peso, reps y fecha, con el `user_id` de la sesión.
  - Borrado físico con confirmación.
  - Acceso a la calculadora.
- [ ] **T27 · Calculadora RM (1 h) · CU-U-16**
  - Ejercicio, peso y máximo de reps (de 1 a 100), enviados a `POST /user_rm/potential`.
  - Muestra el 1RM estimado y la tabla de 1RM a 12RM.
  - Aviso de que el resultado no se guarda.
- [ ] **T28 · Wiki de ejercicios (2 h) · CU-U-15**
  - Búsqueda por nombre y filtro por grupo muscular. Los chips salen de `/muscles/mg/all`, cruzados con ExMuscles y músculos.
  - Ficha con descripción, tips de seguridad y de activación, video (link) e imágenes.
  - Estado vacío.
- [ ] **T29 · Temporizador (1 h) · CU-U-14**
  - Presets de 30 s, 60 s, 90 s, 2 min y 3 min.
  - Iniciar, pausar y reiniciar.
  - Sigue corriendo si cambiás de pantalla.
  - Al llegar a cero, aviso visual y vibración si el dispositivo lo permite.
  - No persiste nada.
- [ ] **T30 · Panel del Admin (0,5 h)**
  - Contadores de ejercicios, músculos, grupos y entrenadores, con accesos directos.
- [ ] **T31 · Ejercicios (2,5 h) · CU-A-01 a CU-A-06**
  - Listado con búsqueda.
  - Alta y edición: nombre, descripción, tips, video e imágenes (URLs), y músculos con selección múltiple. La selección múltiple cubre CU-A-02 y CU-A-03 mediante `exercised_muscles_ids`.
  - Eliminar con confirmación, manejando el rechazo por integridad (V7).
- [ ] **T32 · Músculos (1 h) · CU-A-07 a CU-A-10**
  - Alta, edición y borrado, con selector de grupo muscular.
  - Manejo del rechazo por integridad.
- [ ] **T33 · Grupos musculares (1 h) · CU-A-11 a CU-A-15**
  - Alta, edición y borrado.
  - Detalle con los músculos del grupo (CU-A-12).
- [ ] **T34 · Membresías, tipos (1 h) · CU-A-20 a CU-A-23**
  - Alta y edición: nombre, duración en días y precio.
  - Eliminar es una baja lógica con `set-active`; también se puede reactivar.
- [ ] **T35 · Entrenadores (1 h) · CU-A-16, CU-A-19**
  - Listado con nombre y estado (V3).
  - Eliminar con confirmación.
- [ ] **T36 · Convertir alumno en entrenador (1 h) · CU-A-17**
  - Búsqueda de alumnos.
  - Email profesional y CUIL de 11 dígitos sin guiones, que se puede mostrar con máscara.
- [ ] **T37 · Editar entrenador (0,5 h) · CU-A-18**
  - Según B8.

### Semana 4 (25 al 31/10): núcleo del Usuario, pendientes del Entrenador y backend real

- [ ] **T38 · Home semanal (3 h) · CU-U-08**
  - Usa B1 y B5.
  - Tarjeta del plan vigente con su progreso.
  - Selector de semana (anterior y siguiente) y rutinas de la semana con su estado.
  - Si no hay plan, muestra la rutina puntual. Si no hay asignaciones, estado vacío.
- [ ] **T39 · Detalle de rutina (1,5 h) · CU-U-09**
  - Circuitos en orden, con sus ejercicios y el resumen de series.
  - Contadores de ejercicios y series, y nota del coach.
  - Acceso denegado si la rutina no es del usuario (V4).
- [ ] **T40 · Detalle de ejercicio y ejecución (3 h) · CU-U-10 a CU-U-13**
  - Series desplegadas por bloque: un 3×8 son tres filas marcables. Cada una muestra su tipo (normal, AMRAP o RM) y sus parámetros.
  - Marcar y desmarcar con actualización optimista, revirtiendo si falla.
  - Nota del usuario (crear, editar y borrar) y nota del coach.
  - Mis RMs de ese ejercicio.
  - Atajo al temporizador.
- [ ] **T41 · Asignar planificación a alumno (2 h) · CU-E-13, CU-E-14**
  - Se entra desde la planificación o desde el alumno.
  - Fechas de inicio y fin, y nota del coach.
  - Aviso de solapamiento y confirmación, según B7.
  - Quitar el plan del alumno es una baja lógica, con confirmación.
- [ ] **T42 · Rutina puntual (1,5 h) · CU-E-19, CU-E-20**
  - Asignar una rutina a un alumno, según B5. Si ya la tiene, mostrar el error.
  - Quitar con confirmación.
- [ ] **T43 · Historial de entrenamientos (1,5 h) · CU-E-06, CU-E-07**
  - En el detalle del alumno, en orden cronológico.
  - Filtro por ejercicio con peso, reps y fecha.
- [ ] **T44 · Pasar los mocks a backend real (2 h)**
  - Recorrer el registry y apagar los mocks de todo lo implementado, con una prueba rápida de cada pantalla. Incluye el flag real de contraseña temporal.
  - Dejar en el PR la lista de lo que sigue en mock.
- [ ] **T45 · Extras, solo si sobra tiempo**
  - Progreso del alumno, adherencia y última sesión en Mis alumnos, y timer del Entrenador.
  - Dependen de datos de B1 y B6; si esos datos no existen, no se hacen.

## 7. Ventana de debug (1 al 20/11)

- [ ] Pasar a real lo que haya quedado en mock, a medida que el backend lo implemente.
- [ ] Correr el checklist del apéndice A en celular y en desktop.
- [ ] Corregir los bugs, ordenados por la prioridad de cada rol.
- [ ] Si la base de Render vence, recrearla y volver a correr los seeds. Se recreó el 3/10: si el ciclo es de 30 días, vence alrededor del 2/11, en plena ventana de debug.
- [ ] Actualizar el diagrama de despliegue: el front pasa a Render como Static Site, y Admin usa la web en lugar de Postman.
- [ ] Release final de `develop` a `main` antes del 20/11.

## 8. Riesgos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Los contratos B1 a B9 llegan después del 17/10 | La semana 4 arranca sin base para el núcleo del Usuario | Tipos provisionales en `pending.ts` y mocks; regla de recorte. |
| La semana 4 concentra el núcleo del rol prioritario | Si se atrasa, se come la ventana de debug | Orden fijo dentro de la semana; los extras quedan afuera. |
| Dedicación cerca de 10 h por semana | El plan suma ~69 h y con 10 h por semana entran ~40 h | La regla de recorte define qué se cae primero. |
| El alta y la edición de rutinas y planificaciones no están el 31/10 | El rol Entrenador queda en mock | Se conectan en la ventana de debug; el front no cambia. |
| Free tier de Render | Arranque en frío y base que vence | Aviso en el front; scripts de seed. |
| Diferencias entre el prototipo y los casos de uso o el contrato | Retrabajo | Mandan el caso de uso y el contrato; Claude Code las reporta en cada PR. |

## Apéndice A: checklist de pruebas manuales

Un ítem por caso de uso, con el camino principal y los caminos alternativos de su especificación. Hay que probar cada uno en celular y en desktop.

### Usuario

- [ ] **CU-U-01 Registrar Usuario:** camino principal, email ya registrado, datos inválidos, error de persistencia.
- [ ] **CU-U-02 Login:** camino principal, credenciales inválidas, ingreso con contraseña temporal.
- [ ] **CU-U-03 Cerrar sesión:** camino principal, sesión ya expirada.
- [ ] **CU-U-04 Recuperar contraseña:** camino principal, email no registrado, falla en el envío de email.
- [ ] **CU-U-05 Cambiar contraseña:** camino principal, contraseña actual incorrecta, confirmación no coincide o débil.
- [ ] **CU-U-06 Editar datos personales:** camino principal, datos inválidos.
- [ ] **CU-U-07 Obtener historial de pagos:** camino principal, sin pagos registrados.
- [ ] **CU-U-08 Obtener mi Planificación:** camino principal, sin planificación vigente pero con rutina puntual, sin asignaciones.
- [ ] **CU-U-09 Ver detalle de Rutina:** camino principal, rutina no asignada al usuario.
- [ ] **CU-U-10 Ver detalle de un ejercicio:** camino principal, ejercicio sin series cargadas.
- [ ] **CU-U-11 Ver mis RMs de un ejercicio:** camino principal, sin RMs registrados.
- [ ] **CU-U-12 Marcar serie como realizado:** camino principal, desmarcar serie, error de persistencia.
- [ ] **CU-U-13 Dejar una nota en el ejercicio:** camino principal, nota vacía.
- [ ] **CU-U-14 Temporizador:** camino principal, pausa / reinicio.
- [ ] **CU-U-15 Consultar wiki de ejercicios:** camino principal, sin resultados de búsqueda.
- [ ] **CU-U-16 Calcular mis RM potenciales:** camino principal, datos inválidos.
- [ ] **CU-U-17 Registrar un RM:** camino principal, datos inválidos.
- [ ] **CU-U-18 Editar un RM:** camino principal, RM inexistente, datos inválidos.
- [ ] **CU-U-19 Obtener mis RMs:** camino principal, sin RMs.
- [ ] **CU-U-20 Eliminar un RM:** camino principal, cancela la confirmación, RM inexistente.

### Entrenador

- [ ] **CU-E-01 Obtener alumnos:** camino principal, sin alumnos.
- [ ] **CU-E-02 Obtener alumnos · Filtro por nombre:** camino principal, sin coincidencias.
- [ ] **CU-E-03 Cerrar cuenta de alumno:** camino principal, cancela la confirmación, restricciones de integridad.
- [ ] **CU-E-04 Obtener RMs del alumno:** camino principal, sin RMs.
- [ ] **CU-E-05 Consultar historial de pagos de alumno:** camino principal, sin pagos.
- [ ] **CU-E-06 Consultar historial de entrenamientos de alumno:** camino principal, sin historial.
- [ ] **CU-E-07 Consultar historial de entrenamientos · Filtro por ejercicio:** camino principal, sin registros para el ejercicio.
- [ ] **CU-E-08 Obtener Planificaciones Sistémicas:** camino principal, sin planificaciones.
- [ ] **CU-E-09 Crear Planificación Sistémica:** camino principal, datos inválidos.
- [ ] **CU-E-10 Editar Planificación Sistémica:** camino principal, planificación inexistente, datos inválidos.
- [ ] **CU-E-11 Eliminar Planificación Sistémica (Lógico):** camino principal, cancela la confirmación, planificación en uso.
- [ ] **CU-E-12a Asignar una Rutina a una Planificación Sistémica:** camino principal, sin posición indicada, posición ya ocupada, la misma rutina más de una vez, la rutina está dada de baja, la planificación está dada de baja.
- [ ] **CU-E-12b Asignar Rutinas en Lote a una Planificación Sistémica:** camino principal, la misma rutina seleccionada más de una vez, alguna rutina no existe, alguna rutina está dada de baja, la planificación está dada de baja, selección vacía o demasiado grande.
- [ ] **CU-E-12c Quitar o Reincorporar una Rutina de una Planificación Sistémica (Lógico):** camino principal, cancela la confirmación, reincorporar la rutina, el resto del plan no se renumera, vínculo inexistente, indicar una posición al quitar.
- [ ] **CU-E-12d Quitar o Reincorporar Rutinas en Lote (Lógico):** camino principal, cancela la confirmación, reincorporar en bloque, algún vínculo no existe, la selección tiene repetidos, selección vacía o demasiado grande, vínculos de planificaciones distintas.
- [ ] **CU-E-13 Asignar Planificación a Alumno:** camino principal, solapamiento con plan vigente, error de persistencia.
- [ ] **CU-E-14 Eliminar Planificación a Alumno (Lógico):** camino principal, cancela la confirmación, planificación ya dada de baja.
- [ ] **CU-E-15 Obtener Rutinas Sistémicas:** camino principal, sin rutinas.
- [ ] **CU-E-16 Crear Rutina Sistémica:** camino principal, sin circuitos seleccionados, datos inválidos.
- [ ] **CU-E-17 Editar Rutina Sistémica:** camino principal, lista vacía, rutina inexistente.
- [ ] **CU-E-18 Eliminar Rutina Sistémica (Lógico):** camino principal, cancela la confirmación, rutina en uso.
- [ ] **CU-E-19 Asignar Rutina a Alumno:** camino principal, rutina ya asignada.
- [ ] **CU-E-20 Eliminar Rutina a Alumno:** camino principal, cancela la confirmación.
- [ ] **CU-E-21 Obtener Circuitos:** camino principal, sin circuitos.
- [ ] **CU-E-22 Crear Circuito:** camino principal, circuito sin ejercicios, datos inválidos.
- [ ] **CU-E-23 Editar Circuito:** camino principal, lista vacía, circuito inexistente.
- [ ] **CU-E-24 Eliminar Circuito (Lógico):** camino principal, cancela la confirmación.
- [ ] **CU-E-25 Obtener Membresías:** camino principal, sin tipos de membresía.
- [ ] **CU-E-26 Obtener estado de membresías:** camino principal, sin pagos registrados.
- [ ] **CU-E-27 Obtener alumnos por estado de membresía:** camino principal, sin alumnos en ese estado.
- [ ] **CU-E-28 Obtener alumnos por tipo de membresía:** camino principal, sin alumnos para el tipo.
- [ ] **CU-E-29 Registrar pago de alumno:** camino principal, datos de pago inválidos.

### Admin

- [ ] **CU-A-01 Obtener Ejercicios:** camino principal, catálogo vacío.
- [ ] **CU-A-02 Asignar Músculo a Ejercicio:** camino principal, relación ya existente, ejercicio o músculo inexistente.
- [ ] **CU-A-03 Desasignar Músculo de Ejercicio:** camino principal, relación inexistente.
- [ ] **CU-A-04 Crear Ejercicio:** camino principal, datos inválidos o nombre duplicado.
- [ ] **CU-A-05 Editar Ejercicio:** camino principal, ejercicio inexistente, datos inválidos.
- [ ] **CU-A-06 Eliminar Ejercicio:** camino principal, ejercicio en uso, ejercicio inexistente.
- [ ] **CU-A-07 Obtener Músculos:** camino principal, catálogo vacío.
- [ ] **CU-A-08 Crear Músculo:** camino principal, grupo inexistente o datos inválidos.
- [ ] **CU-A-09 Editar Músculo:** camino principal, músculo inexistente, datos inválidos.
- [ ] **CU-A-10 Eliminar Músculo:** camino principal, músculo en uso, músculo inexistente.
- [ ] **CU-A-11 Obtener Grupos Musculares:** camino principal, catálogo vacío.
- [ ] **CU-A-12 Obtener Músculos del Grupo Muscular:** camino principal, grupo sin músculos.
- [ ] **CU-A-13 Crear Grupo Muscular:** camino principal, datos inválidos o nombre duplicado.
- [ ] **CU-A-14 Editar Grupo Muscular:** camino principal, grupo inexistente, datos inválidos.
- [ ] **CU-A-15 Eliminar Grupo Muscular:** camino principal, grupo con músculos, grupo inexistente.
- [ ] **CU-A-16 Obtener Entrenadores:** camino principal, sin entrenadores.
- [ ] **CU-A-17 Convertir Alumno a Entrenador:** camino principal, ya es entrenador, datos profesionales inválidos.
- [ ] **CU-A-18 Editar datos de entrenador:** camino principal, entrenador inexistente, datos inválidos.
- [ ] **CU-A-19 Eliminar Entrenador:** camino principal, entrenador con dependencias, entrenador inexistente.
- [ ] **CU-A-20 Obtener Membresías:** camino principal, sin tipos definidos.
- [ ] **CU-A-21 Crear Membresía:** camino principal, datos inválidos o nombre duplicado.
- [ ] **CU-A-22 Editar Membresía:** camino principal, membresía inexistente, datos inválidos.
- [ ] **CU-A-23 Eliminar Membresía:** camino principal, membresía en uso, membresía inexistente.
