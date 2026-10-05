# PowerApp Web: plan de implementación

Versión 1.3 · 5 de octubre de 2026. Las reglas técnicas y de dominio están en `CLAUDE.md`. Los casos de uso, el prototipo y el modelo de datos viven en el repo [PowerApp-Docs](https://github.com/FranCarames/PowerApp-Docs), que es la fuente de verdad de la documentación.

## 1. Objetivo y alcance

El objetivo es construir el front web de PowerApp para los tres roles, Usuario, Entrenador y Admin, en React + Vite + TypeScript, consumiendo la API existente y desplegado en Render como Static Site.

**Entra:**

- Las pantallas de los 75 casos de uso.
- Las secciones que el prototipo del 5/10 le suma al Admin (usuarios, circuitos, rutinas y planificaciones), que reutilizan casos de uso del Entrenador.
- El temporizador.
- La navegación por rol.
- Mocks para lo que el backend todavía no tiene, salvo rutinas y planificaciones, que llevan placeholder hasta que su backend esté completo.
- Deploy.

**No entra:**

- Desarrollo del backend, que hace Fran por separado (ver la sección 4).
- Tests automatizados. Las pruebas son manuales, con el checklist del apéndice A.
- Las pantallas sin caso de uso (Progreso, adherencia, última sesión y timer del Entrenador). Se hacen solo si sobra tiempo, en T45.

## 2. Calendario

| Etapa | Fechas | Contenido | Estimación |
|---|---|---|---|
| Semana 1 | 3 al 10/10 | Fundaciones, Auth y Mi cuenta (T01 a T14). Desde el 5/10, Admin: navegación, panel, usuarios, ejercicios, catálogo, membresías y entrenadores. | ~12 h restantes |
| Semana 2 | 11 al 17/10 | Circuitos (Admin y Entrenador) y Entrenador con contrato existente | ~13,5 h |
| Semana 3 | 18 al 24/10 | Contratos nuevos, Usuario sin dependencias y núcleo del Usuario | ~14,5 h |
| Semana 4 | 25 al 31/10 | Historial de entrenamientos, paso a backend real y, si el backend ya está, el bloque C2 | ~3,5 h, más el bloque C2 |
| Bloque C2 | Cuando el backend de rutinas y planificaciones esté completo (previsto antes del 31/10) | Rutinas y planificaciones para el Admin y el Entrenador, y asignaciones a alumnos | ~13 h |
| Debug | 1 al 20/11 | Pruebas manuales, corrección, documentación | — |
| Entrega final | 20/11 | — | — |

- **Dedicación disponible:** entre 10 y 20 h por semana. Al 5/10 quedan unas 56,5 h sin los extras, para 26 días: alrededor de 15 h por semana. Con menos, aplica la regla de recorte de la sección 3.
- **Bloque C2:** su fecha depende del backend. Si llega después del 31/10, se come parte de la ventana de debug.
- **Estimaciones:** son orientativas e incluyen el trabajo de Claude Code y la revisión de Fran.

## 3. Prioridades y regla de recorte

- **Prioridad de roles, para recortar:** 1. Usuario, 2. Entrenador, 3. Admin.
- **Orden de construcción:** por decisión de Fran (5/10), el Admin va primero y se adelanta todo lo que su backend ya permite. Las secciones de rutinas y planificaciones, tanto del Admin como del Entrenador, quedan con un placeholder y se construyen en el bloque C2, cuando su backend esté completo. Se hacen directamente contra el backend real, sin mocks.

**Regla de recorte (propuesta, a confirmar por Fran):**

1. **Primero se caen los extras sin caso de uso (T45).**
2. **Si al 17/10 el Admin (T46, T30 a T37, T19 y T20) no está completo,** lo que falte se mueve después de T44. La excepción son T19 y T20, que el Entrenador necesita para T48.
3. **Si la semana 3 se atrasa,** el núcleo del Usuario (T38 a T40) va antes que T26 a T29.
4. **El bloque C2 arranca cuando Fran avise que el backend está completo** y sigue este orden: T21, T22, T23, T24, T49, T41, T42. Si arranca después del 31/10, entra en la primera semana de debug (1 al 7/11).

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
| B8 | Editar entrenador | CU-A-18 | Editar `coach_email` y `cuil`. El 5/10 Fran indicó que los contratos del Admin están completos; T37 confirma si el endpoint ya está en el Swagger. | T37 |
| B9 | Flag de contraseña temporal | CU-U-02 | Un campo en la respuesta del login que indique cambio de contraseña obligatorio. T09 propone `password_change_required` (boolean, junto a los campos del `User`; falta o `false` es una contraseña común). Hoy el `loginUser` del backend, cuando la contraseña no es la común, prueba la temporal y responde igual que un login normal, sin ningún flag: se agregaría en esa rama. | T09 (con mock), T44 |

### 4.2 Configuración y trabajo del backend

| Id | Qué | Para cuándo |
|---|---|---|
| C1 | CORS habilitado para el dominio del front en Render (`https://powerapp-web.onrender.com`), con `Access-Control-Expose-Headers: Authorization`. Sin esto, el navegador no deja leer el token del login. En local no hace falta, porque el proxy de Vite lo resuelve. Pendiente: T08 no lo pudo comprobar. | Lo antes posible |
| C2 | Backend completo de rutinas y planificaciones: alta, edición y baja de rutinas y planificaciones, asignación de rutinas a planificaciones, rutina puntual (B5) y asignación de planificaciones a alumnos (B7). Hasta entonces, el Admin y el Entrenador muestran un placeholder en esas secciones. Cuando esté, Fran avisa y arranca el bloque C2. | Antes del 31/10 |
| C3 | Implementación de B1 a B9. | Antes del 31/10 |
| C4 | Integrar el servicio de email. Hoy el backend imprime la contraseña temporal en su consola, así que CU-U-04 no funciona en producción (lo detectó T11). | Antes del 20/11 |

### 4.3 Puntos a verificar contra el backend real

El contrato no los documenta del todo. Se resuelven en la tarea indicada.

| Id | Qué | Tarea |
|---|---|---|
| V1 | Forma de la respuesta de `GET /membership/status/users` y `GET /membership/type/users`, que no tienen schema. | T34 y T47 (lo resuelve la primera que llegue), T17. `status/users` resuelto en T47: la forma sale del código del backend (`{ status, total, expiring_soon_days, students[] }`) y está tipada en `pending.ts`. `type/users` resuelto en T34, también del código del backend: `{ total_students, without_payments, groups: [{ membership_id, membership_name, total, students[] }] }` (sin `membership_id`) y `{ total, students[] }` (con él); tipado en `pending.ts` |
| V2 | `exercise` dentro de `CircuitExerciseResponseDto` es un objeto sin tipar. | T20, T39 |
| V3 | `GET /coach/all` devuelve el Coach sin nombre ni apellido. Hay que confirmar si `GET /users/all?role=coach` trae el coach anidado y sirve para el listado. | T35 |
| V4 | Que un usuario con `role=user` pueda leer `GET /routine/{id}` y `GET /exercise/{id}`. | T39 |
| V5 | El DTO pide contraseñas de 6 caracteres como mínimo. El prototipo muestra mínimo 8, con mayúscula y número. El front valida con el DTO; si se quieren las reglas del prototipo, hay que subirlas en el backend. | Resuelto en T10 y T12 |
| V6 | El registro devuelve token, pero CU-U-01 pide volver al login. El front sigue el caso de uso. | Resuelto en T10 |
| V7 | Código y mensaje que devuelve el backend cuando rechaza un borrado por integridad (ejercicio, músculo, grupo o entrenador). | T31 a T35. Ejercicio resuelto en T31 con el código del backend: no distingue el motivo y responde `500 { error: 'Error al eliminar el ejercicio' }`; músculo resuelto en T32: no hay rechazo, porque `Exercised_Muscle` borra en cascada y un músculo en uso se borra igual y se quita de los ejercicios (CU-A-10 dice lo contrario); grupo resuelto en T33: se cumple CU-A-15, porque `Muscle.muscle_group_id` no borra en cascada y el backend rechaza un grupo con músculos, pero con un `500 { error: 'Error al eliminar el grupo muscular' }` genérico; falta el entrenador (T35) |
| V9 | El Swagger no declara lo que el backend sí devuelve en ejercicios y músculos: `GET /exercise/all` y `GET /exercise/{id}` traen `exercisedMuscles` (los músculos, con su `id`); `GET /muscles/mg/all` trae los `muscles` de cada grupo; `GET /exercise/ExMuscles/all` devuelve `{ id, exercise: { id, name }, muscle: { id, name } }` y no `exercise_id` y `muscle_id`; y `GET /muscles/all` trae `muscle_group: { id, name }` y no `muscle_group_id`. Fran tiene que confirmarlo y declararlo en el contrato | T31 (tipado en `pending.ts`), T28, T32 y T33 |
| V8 | Que el rol `admin` tenga permiso en los endpoints pensados para el Entrenador que usa el Admin desde el prototipo del 5/10: `GET /users/all`, `POST /users/set-active/{id}`, `GET /planification/user/{id}/active` y todo `/routine/*`, `/routine/circuit/*` y `/planification/*`. | Relevado en T46: los guards del código del backend le dan permiso al rol `admin` en todos. A confirmar contra el backend real en T47 y T19 a T24 |

## 5. Mapa de pantallas

Referencias de estado:

- **REAL:** el endpoint ya funciona.
- **MOCK:** el contrato existe pero falta la implementación.
- **PENDIENTE:** falta el contrato (sección 4.1).
- **CLIENTE:** no usa backend.
- **PLACEHOLDER:** la sección aparece en la navegación con un aviso de "en construcción" hasta el bloque C2.
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
| Circuitos (acceso a definir en T48) | CU-E-21, CU-E-24 | `GET /routine/circuit/all-plus`, `POST /routine/circuit/set-active/{id}` | REAL |
| Editor de circuito | CU-E-22, CU-E-23 | `GET /routine/circuit/{id}`, `POST /routine/circuit/create`, `POST /routine/circuit/edit/{id}`, `GET /exercise/all` | REAL (componente compartido con el Admin) |
| Rutinas | CU-E-15, CU-E-18 | `GET /routine/all-plus`, `POST /routine/set-active/{id}` | PLACEHOLDER hasta el bloque C2 |
| Editor de rutina | CU-E-16, CU-E-17 | `GET /routine/{id}`, `POST /routine/create`, `POST /routine/edit/{id}`, `GET /routine/circuit/all-plus` | PLACEHOLDER hasta el bloque C2 (componente compartido con el Admin) |
| Planificaciones | CU-E-08, CU-E-11 | `GET /planification/all`, `POST /planification/set-active/{id}` | PLACEHOLDER hasta el bloque C2 |
| Editor de planificación | CU-E-09, CU-E-10, CU-E-12a a CU-E-12d | `GET /planification/{id}`, `POST /planification/create`, `POST /planification/edit/{id}`, `POST /planification/routine/assign`, `POST /planification/routine/assign-bulk`, `POST /planification/routine/set-active/{id}`, `POST /planification/routine/set-active-bulk`, `GET /routine/all` | PLACEHOLDER hasta el bloque C2 (componente compartido con el Admin) |
| Asignar planificación a alumno | CU-E-13, CU-E-14 | `POST /planification/user/assign`, `POST /planification/user/edit/{id}`, `GET` y `DELETE /planification/user/{id}` | PENDIENTE (B7), bloque C2 |
| Asignar rutina a alumno | CU-E-19, CU-E-20 | B5 | PENDIENTE (B5), bloque C2 |
| Timer del Entrenador | sin CU | — | EXTRA |
| Mi cuenta | reutiliza CU-U-05 y CU-U-06 | Los mismos que Usuario | REAL |

### Admin

Desde el prototipo del 5/10, el Admin también gestiona usuarios, circuitos, rutinas y planificaciones. Esas pantallas usan endpoints pensados para el Entrenador y no tienen CU propio del Admin: reutilizan los del Entrenador. Antes de construirlas hay que confirmar que el backend le da permiso al rol `admin` (V8).

| Pantalla | CU | Endpoints | Estado |
|---|---|---|---|
| Navegación (sidebar, tab bar y Más) | — | — | CLIENTE |
| Panel | conteos | `GET /users/all` (`total`), `GET /exercise/all`, `GET /routine/circuit/all`, `GET /routine/all`, `GET /planification/all`, `GET /coach/all` | REAL |
| Usuarios | los de CU-E-01 a CU-E-03 | `GET /users/all`, `GET /users/get/{id}`, `POST /users/set-active/{id}`, `GET /planification/user/{id}/active`, `GET /membership/payment/user/{id}`, `GET /membership/status/users` | REAL (ver V8) |
| Entrenadores | CU-A-16, CU-A-19 | `GET /coach/all` o `GET /users/all?role=coach` (V3), `POST /coach/delete_coach/{id}` | REAL |
| Convertir alumno | CU-A-17 | `GET /users/all?role=user`, `POST /coach/promote_user` | REAL |
| Editar entrenador | CU-A-18 | B8 | A confirmar en T37 |
| Ejercicios y editor de ejercicio | CU-A-01 a CU-A-06 | `GET /exercise/all`, `GET /exercise/{id}`, `GET /exercise/ExMuscles/all`, `POST /exercise/create`, `POST /exercise/edit/{id}`, `DELETE /exercise/{id}`, `GET /muscles/all`, `GET /muscles/mg/all` | REAL |
| Circuitos y editor de circuito | los de CU-E-21 a CU-E-24 | `GET /routine/circuit/all-plus`, `GET /routine/circuit/{id}`, `POST /routine/circuit/create`, `POST /routine/circuit/edit/{id}`, `POST /routine/circuit/set-active/{id}`, `GET /routine/all-plus` | REAL (ver V8) |
| Rutinas y editor de rutina | los de CU-E-15 a CU-E-18 | `GET /routine/all-plus`, `GET /routine/{id}`, `POST /routine/create`, `POST /routine/edit/{id}`, `POST /routine/set-active/{id}` | PLACEHOLDER hasta el bloque C2 (ver V8) |
| Planificaciones y editor de planificación | los de CU-E-08 a CU-E-12d | Los mismos que el Entrenador, sin la asignación a alumnos | PLACEHOLDER hasta el bloque C2 (ver V8) |
| Catálogo: músculos | CU-A-07 a CU-A-10 | `GET /muscles/all`, `GET /muscles/get/{id}`, `POST /muscles/create`, `POST /muscles/edit/{id}`, `DELETE /muscles/{id}`, `GET /muscles/mg/all` | REAL |
| Catálogo: grupos musculares | CU-A-11 a CU-A-15 | `GET /muscles/mg/all`, `GET /muscles/mg/get/{id}`, `POST /muscles/mg/create`, `POST /muscles/mg/edit/{id}`, `DELETE /muscles/mg/{id}`. Los músculos del grupo se filtran de `/muscles/all`. | REAL |
| Membresías (tipos) | CU-A-20 a CU-A-23 | `GET /membership/all`, `GET /membership/type/users`, `POST /membership/create`, `POST /membership/edit/{id}`, `POST /membership/set-active/{id}` | REAL |
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
- [x] **T09 · Login (1 h) · CU-U-02**
  - Email y contraseña, con las validaciones de `LoginUserDto`.
  - Credenciales inválidas: error genérico. Cuenta inactiva (403): mensaje específico.
  - Redirección según el rol.
  - Si el flag de B9 (con mock hasta que exista) indica contraseña temporal, se abre un modal bloqueante "Actualizá tu contraseña" que lleva a `/cambiar-contrasena`.
  - Links a registro y a recuperar.
  - Cómo quedó: `LoginPage` con React Hook Form y `loginSchema` (email hasta 50, contraseña de 6 a 50). Sumó `react-hook-form` y `zod`, que son del stack, y un `zodResolver` propio en `shared/lib` en lugar de `@hookform/resolvers`, que no está en la lista. `useLogin()` llama a `POST /users/login` (real) y arma la `Session` con el token del header. Está explicado en el README, sección "Login".
  - B9: el tipo provisional es `LoginResponse` en `pending.ts`, con el campo propuesto `password_change_required` (boolean). Con `true`, la sesión no se abre hasta que el usuario toca el botón del modal bloqueante: si se abriera antes, el guard de T07 lo llevaría a `/cambiar-contrasena` sin mostrarlo.
  - Mock: `POST /users/login` está en `mock: true`, pero solo responde las cuentas de demo de `src/mocks/fixtures/users.ts` (una por rol, una con contraseña temporal y una cerrada). Los demás emails pasan al backend real con `passthrough`. El token de las cuentas de demo es falso, así que los endpoints reales las rechazan con 401.
  - Reemplazó el `/login` provisorio de T07 (los botones "Entrar como…" y `mockSession.ts`). Los botones de prueba de `/cambiar-contrasena` siguen hasta T12.
  - Verificado contra un doble local del contrato (`.claude/fake-backend.cjs`), no contra el backend real: el de Render no responde y el local no estaba encendido. Falta probarlo con el real, ya con C1 en Render.
  - Para las tareas que siguen: T10 y T12 reutilizan `zodResolver` y el patrón de `schemas.ts` (un schema por formulario). T44 apaga el mock del login (`mock: false`) cuando B9 exista en el contrato, y con eso dejan de existir las cuentas de demo.
- [x] **T10 · Registro (1 h) · CU-U-01**
  - Campos de `CreateUserDto`: nombre, apellido, email, prefijo, teléfono y contraseña. Siempre con `role: user`.
  - Email ya registrado: mensaje con links a login y a recuperar.
  - Después del alta, vuelve al login (V5, V6).
  - Cómo quedó: `RegisterPage` con React Hook Form y `registerSchema` (todos obligatorios; nombre y apellido hasta 50, email hasta 50, prefijo hasta 10, teléfono hasta 20, contraseña de 6 a 50). `useRegister()` manda siempre `role: 'user'`. Sin mock: `POST /users/register` es real. Está explicado en el README, sección "Registro".
  - V5: el front valida con el DTO (6 caracteres, sin mayúscula ni número), y el placeholder dice "Mínimo 6 caracteres", no 8 como el prototipo. V6: el token que devuelve el registro se ignora; se vuelve a `/login` con un aviso y sin abrir sesión.
  - Email repetido: confirmado en `users.service.ts` del backend, responde 409 con `{ error: 'Ya existe un usuario con ese email' }`. La pantalla muestra el aviso con los links, deja el foco en el email y conserva lo escrito.
  - Verificado contra un doble local que responde como ese código (201 con token en el header, 409, 400 y 500), no contra el backend real: el de Render no responde y el local no estaba encendido.
  - Para las tareas que siguen: `schemas.ts` ya comparte las reglas de `email` y de contraseña entre el login y el registro. El teléfono con código de país y número vuelve a aparecer en T14 (datos personales): si se repite, conviene extraerlo a `shared/ui`.
- [x] **T11 · Recuperar contraseña (0,5 h) · CU-U-04**
  - Envía el email a `POST /users/recover-password`.
  - El modal de confirmación muestra el mismo mensaje exista o no el email.
  - Si falla el envío, permite reintentar.
  - Cómo quedó: `RecoverPage` con React Hook Form y `recoverSchema`. `useRecoverPassword()` llama al endpoint real y la pantalla ignora su respuesta: el modal dice siempre "Si *email* está registrado, te enviamos una contraseña temporal…". Con un fallo, aviso rojo, botón "Reintentar" y el email conservado. Sin mock. Está explicado en el README, sección "Recuperar contraseña".
  - Textos que cambian respecto del prototipo, porque no serían ciertos: la contraseña temporal real tiene 10 caracteres entre letras y números (el prototipo dice "6 dígitos"), y "la enviamos a *email*" pasa a "si *email* está registrado, te enviamos…" (con un email que no existe, la versión del prototipo sería falsa).
  - Verificado contra un doble local que responde como el código del backend (200 con el mismo mensaje para cualquier email, y 500), no contra el backend real.
  - Pendiente del backend, sin ticket en este plan: el servicio de email está sin integrar. El backend imprime la temporal en su consola (`[EMAIL STUB]`), así que hoy ningún usuario recibe el correo. Para probar el ingreso con la temporal con el backend local, se toma de esa consola.
  - Para las tareas que siguen: T12 recibe a quien entra con la temporal. Hasta que B9 exista, el login no avisa que se usó una temporal, así que el cambio obligatorio solo se ve con las cuentas de demo.
- [x] **T12 · Cambiar contraseña (1 h) · CU-U-05**
  - Voluntario: desde Mi cuenta, con contraseña actual, nueva y repetir.
  - Obligatorio: después de entrar con la temporal; la "actual" es la temporal.
  - Un 401 se muestra como "La contraseña actual es incorrecta".
  - Al terminar el cambio obligatorio, se libera el guard y se va al home.
  - Cómo quedó: `ChangePasswordPage` reemplaza la provisoria y atiende las dos formas en `/cambiar-contrasena`, según `passwordChangeRequired`. `changePasswordSchema` replica `ChangePasswordDto` y "repetir" no viaja. Está explicado en el README, sección "Cambiar contraseña".
  - **Corrección en la capa de API (T07):** el 401 de este endpoint es un error de negocio (`{ error }`), no una sesión vencida, pero el cliente cerraba la sesión ante cualquier 401 con token: escribir mal la contraseña actual te deslogueaba. Ahora `connectApi` cierra solo ante un 401 de guard (`isSessionExpiredError`: el cuerpo trae `statusCode`) o uno que no reconoce. La regla de `CLAUDE.md` ("cuenta solo un 401 de un request que llevaba token") queda afinada por esto; sugiero actualizar su texto.
  - V5: la tarjeta de requisitos solo muestra las reglas del DTO (6 a 50 caracteres y que coincidan), no las del prototipo (8, mayúscula y número).
  - La contraseña actual se pide también en el cambio obligatorio (el prototipo no la tiene): el DTO exige `current_password` y ahí es la temporal. Se agregó "Cerrar sesión" como salida de esa variante, porque con el cambio pendiente no hay otra pantalla a la que ir.
  - Mock: `POST /users/change-password` atiende solo a las cuentas de demo (por su token falso) y el resto pasa al backend real. Con esto el cambio obligatorio se puede recorrer completo sin backend: login de la cuenta con contraseña temporal, modal, cambio y home. El estado vive en memoria.
  - Verificado contra un doble local que responde como el código del backend (guard 401, 400 por campos de más, 401 de negocio, 200 y 500), no contra el backend real.
  - Para las tareas que siguen: T13 (Mi cuenta) tiene que linkear a `/cambiar-contrasena` para el cambio voluntario. Si se prefiere que esa pantalla se vea dentro del marco de la app (con la tab bar), como en el prototipo, alcanza con registrar el mismo componente también bajo `/cuenta/contrasena`.
- [x] **T13 · Mi cuenta, datos personales y cerrar sesión (1,5 h) · CU-U-06, CU-U-03**
  - Menú de cuenta compartido por los tres roles.
  - Datos personales precargados con `GET /users/get/{id}` y guardados con `POST /users/edit`. Un 409 se muestra como "El email ya está en uso". Al guardar, se actualiza el usuario de la sesión. La foto de perfil va como URL.
  - Cerrar sesión: `POST /users/logout` y limpieza de la sesión. Aunque el request falle, la sesión se cierra igual.
  - Cómo quedó: `AccountPage` con el menú por rol, `PersonalDataPage` con su formulario y `logout()` para cerrar la sesión. Está explicado en el README, sección "Mi cuenta".
  - Menú: Datos personales y Cambiar contraseña van para los tres roles, como dice la sección 5 de este plan; el prototipo se los muestra solo al alumno. Faltan en el encabezado la píldora "Membresía activa" del alumno (sale del último pago: T14) y "N alumnos activos" del entrenador (sale del listado de alumnos: T15).
  - Hasta que existan sus tareas, tres ítems abren "Página no encontrada": Historial de pagos (T14), Control de membresías del entrenador (T17) y Biblioteca de ejercicios (T28). T14 tiene además que dejar `/cuenta/pagos` solo para el rol Usuario.
  - Datos personales: la foto de perfil es un campo opcional con un link `http(s)`. Una foto vacía no se manda, porque el backend la valida como URL y no hay cómo borrarla con ese DTO. El teléfono se pide completo (código y número), como en el registro: en el DTO es opcional, pero un usuario sembrado sin teléfono tendría que cargarlo para guardar otros cambios.
  - **Bug encontrado y corregido durante la verificación:** el formulario tomaba `defaultValues` al montarse, así que con el dato viejo en el caché mostraba lo anterior al reabrirse tras guardar (y guardar desde ahí lo habría pisado). Ahora el caché queda con lo guardado y el formulario usa `values` con `keepDirtyValues`.
  - Cerrar sesión: `POST /users/logout` es público y el backend solo confirma (el cierre es descartar el token). El request sale sin esperarse y la sesión se cierra enseguida; si falla, se cierra igual y sin error. `useAuth().signOut` ahora hace esto, y también lo usa el cierre de sesión del cambio obligatorio de contraseña.
  - Se extrajo `PhoneField` a `shared/ui` (lo usan el registro y los datos personales), las reglas de campos de usuario a `shared/lib/userFields.ts` y `formatMonthYear` a `shared/lib/dates.ts`. El registro, el login y la recuperación se volvieron a verificar: mismos mensajes y mismo teléfono.
  - Mock: `GET /users/get/{id}` y `POST /users/edit` atienden solo a las cuentas de demo y el resto pasa al backend real. Las ediciones viven en memoria.
  - Verificado contra un doble local que responde como el código del backend (guard, 400 por campos de más y URL inválida, 409, 500 y 200), no contra el backend real.
  - Para las tareas que siguen: T14 y T15 completan el encabezado de Mi cuenta (la píldora y el conteo de alumnos). Cualquier pantalla que edite al usuario de la sesión tiene que pasar por `useAuth().updateUser`, para que el nombre y la foto se actualicen en toda la app.
- [x] **T14 · Historial de pagos del usuario (1 h) · CU-U-07**
  - Pagos ordenados por fecha descendente, con su `expired_at`.
  - Tarjeta con la membresía actual y su estado, según el último pago.
  - Estado vacío.
  - Cómo quedó: `PaymentsPage` en `/cuenta/pagos`, solo para el rol Usuario (se agregó el `RequireRole` que T13 dejó anotado). Está explicado en el README, sección "Historial de pagos".
  - "El último pago" es el de **vencimiento más lejano**, no el más reciente por fecha: así lo hace el backend, y es lo que decide el estado. La lista, en cambio, va por fecha de pago, del más reciente al más antiguo, porque el backend devuelve los pagos sin ordenar.
  - Estado de la membresía (Activa, Por vencer, Vencida) calculado con `expired_at` y no con el flag `active` del pago, que el backend actualiza una vez por día. La ventana de "por vencer" es de 7 días: es la que el backend usa por defecto, pero se configura (`MEMBERSHIP_EXPIRING_SOON_DAYS`) y solo el resumen de coach/admin la informa, así que el alumno no puede leerla. Si en el backend se cambia, hay que cambiar `EXPIRING_SOON_DAYS` a mano.
  - Se completó el encabezado de Mi cuenta (T13): la píldora de membresía del alumno, que comparte la query con el historial. Queda pendiente solo el "N alumnos activos" del entrenador (T15).
  - Con esto, de los tres ítems de Mi cuenta que abrían "Página no encontrada", quedan dos: Control de membresías del entrenador (T17) y Biblioteca de ejercicios (T28).
  - Cada pago muestra el plan, cuándo se pagó, cuándo vence y el monto en dos líneas fijas; el monto es el del día del pago (el backend lo guarda en el pago).
  - Piezas nuevas en `shared/lib`: `membershipStatus.ts` (estados, etiquetas, colores y la regla del último pago, que van a reutilizar T15 a T18), `formatDate` y `formatPrice`.
  - Mock: los pagos de las cuentas de demo, con fechas relativas a hoy: el alumno tiene 4 pagos y vence en 15 días (activa), y la cuenta de contraseña temporal tiene 1 que vence en 3 (por vencer). Los demás ids van al backend real.
  - Verificado contra un doble local que responde como el código del backend (pagos sin ordenar, vencida, por vencer, sin pagos y error), no contra el backend real.
  - Para las tareas que siguen: T17 y T18 (membresías del entrenador) reutilizan `MEMBERSHIP_STATUS_LABEL` y `MEMBERSHIP_STATUS_TONE`. El prototipo ya usa ahí las mismas etiquetas: "Activa", "Por vencer" y "Vencida".

### Semana 1, segunda parte (5 al 10/10): Admin, gestión y catálogo

Por decisión de Fran (5/10), el Admin se adelanta todo lo que su backend permite. El prototipo web del 5/10 le suma accesos a Usuarios, Ejercicios, Circuitos, Rutinas y Planificaciones. Rutinas y Planificaciones quedan con un placeholder hasta el bloque C2. Las tareas conservan su número para no romper las referencias de las tareas hechas ni los comentarios `TEMPORAL (Txx)` del código; las nuevas siguen desde T46.

- [x] **T46 · Navegación del Admin (1 h)** · nueva
  - Sidebar, desde 960 px, en tres grupos con título:
    - Sin título: Inicio, Usuarios y Entrenadores.
    - "Entrenamiento": Ejercicios, Circuitos, Rutinas y Planificaciones.
    - "Configuración": Catálogo, Membresías y Perfil.
  - Tab bar en mobile: Inicio, Usuarios, Ejercicios, Rutinas y Más. "Más" (`/a/mas`) es una pantalla de accesos a Planificaciones, Circuitos, Entrenadores, Catálogo, Membresías y Mi cuenta. Su tab queda activo en cualquier pantalla que no esté en la tab bar.
  - Rutas nuevas, cada una con su pantalla `TEMPORAL (Txx)`: `/a/usuarios`, `/a/ejercicios`, `/a/circuitos`, `/a/circuitos/:id`, `/a/rutinas`, `/a/rutinas/:id`, `/a/planes`, `/a/planes/:id` y `/a/mas`. Músculos, grupos, membresías y la edición de entrenadores van en modales y no llevan ruta propia.
  - Placeholder de sección en construcción, como componente de `shared/ui` (el Entrenador lo reutiliza en T48): título de la sección y el texto "Esta sección se habilita cuando el backend de rutinas y planificaciones esté completo". Lo usan `/a/rutinas`, `/a/rutinas/:id`, `/a/planes` y `/a/planes/:id` hasta el bloque C2. Sus entradas de la navegación se ven igual que las demás.
  - Revisar en el código del backend, sin modificarlo, qué guards tienen los endpoints de la sección 5 que usa el Admin, y anotar el resultado de V8 en el PR.
  - Actualizar `CLAUDE.md`:
    - En "Navegación y rutas", la fila del Admin y su lista de rutas, según esta tarea.
    - En "API", la regla del 401 según la corrección de T12: cierra la sesión un 401 de guard (el cuerpo trae `statusCode`); un 401 de negocio (`{ error }`) es un error del formulario.
  - Listo cuando: la sidebar y la tab bar del Admin coinciden con el prototipo, Rutinas y Planificaciones muestran el placeholder, y el resto de las rutas abre su pantalla temporal.
  - Cómo quedó: `src/app/AppShell/navigation.ts` separa `TAB_BAR` (mobile) y `SIDEBAR` (desktop, en bloques con título), y `activeTabOf` marca una sola tab. Está explicado en el README, sección "Navegación por rol".
  - Medido contra el prototipo del 5/10 en 1280 y 390 px: cada fila de la barra lateral del Admin (posición, alto, colores, tipografía), la tab bar y Más son idénticas. La barra lateral de los tres roles cambió con ese prototipo: 2 px entre entradas en lugar de 4 y desplazamiento vertical si no entra.
  - `Más` es la entrada `fallback`: queda marcada en toda ruta que no esté en la tab bar, incluida Mi cuenta. La etiqueta de la tab de Entrenadores pasó de "Coaches" a "Entrenadores", como en el prototipo.
  - Se sumó el ícono `cycle` (Circuitos) del prototipo, que faltaba en `shared/icons`.
  - `SectionPlaceholder` (`shared/ui`) lo usan `/a/rutinas`, `/a/rutinas/:id`, `/a/planes` y `/a/planes/:id`. Las pantallas temporales son Usuarios (T47), Ejercicios (T31), Circuitos (T19), el editor de circuito (T20), Catálogo (T32 y T33) y Membresías (T34).
  - Rutas: se sumó `/a/membresias`, que no estaba en la lista de esta tarea pero es una entrada de la barra lateral. `/a/convertir` y `/a/ejercicios/:id` todavía no tienen pantalla (T36 y T31): sus entradas de navegación ya las cubren con `also` y el prefijo. `/a/musculos/:id` y `/a/grupos/:id` salieron de `CLAUDE.md`, porque van en modales.
  - `CLAUDE.md` actualizado: la fila y las rutas del Admin, y la regla del 401 (cierra la sesión un 401 de guard, no uno de negocio).
  - **V8, relevado en el código del backend (solo lectura):** `GET /users/all` es `@Auth()` (cualquier autenticado); `POST /users/set-active/{id}` es coach y admin; `GET /planification/user/{id}/active` es user, coach y admin; y todo `/routine/*`, `/routine/circuit/*` y `/planification/*` es coach y admin. El Admin tiene permiso en todos. Falta comprobarlo contra el backend real.
  - Otros hallazgos del relevamiento, para Fran: (1) `GET /routine/{id}` es solo coach y admin, así que un alumno recibe 403: V4 da negativo para la rutina (T39 / B2), y `GET /exercise/{id}` sí es de cualquier autenticado. (2) `GET /coach/all` y `GET /coach/get/{id}` no tienen guard y devuelven el CUIL y el email profesional de cada entrenador: cualquiera, sin token, puede leerlos. (3) El código local del backend no tiene un endpoint para editar entrenadores (B8): el `CoachController` solo tiene `all`, `get/:id`, `promote_user` y `delete_coach/:id`.
  - Verificado en el navegador con las cuentas de demo (mocks): qué entrada queda marcada en cada ruta del Admin, en desktop y en mobile, y que la barra lateral y la tab bar del Entrenador siguen igual. No hay requests nuevos.
- [x] **T30 · Panel del Admin (1 h)**
  - Contadores que llevan a su sección: usuarios (`total` de `GET /users/all`), ejercicios, circuitos activos (`GET /routine/circuit/all`) y rutinas (`GET /routine/all`, que ya responde; hasta el bloque C2 lleva al placeholder).
  - Sección "Gestión" con accesos a Planificaciones (placeholder hasta el bloque C2), Entrenadores, Músculos, Grupos musculares y Membresías, cada uno con su dato de apoyo (planes, entrenadores activos).
  - Cómo quedó: `DashboardPage` en `/a/inicio`, con `useDashboardCounts` (seis queries, cada una con su estado) y `DashboardCounter`. Está explicado en el README, sección "Panel del Admin".
  - Números: Usuarios es el `total` de `GET /users/all` y cuenta todos los roles, también admins (el prototipo cuenta solo alumnos y entrenadores). Ejercicios, Circuitos activos, Rutinas, planes y entrenadores activos salen del largo de sus listados, filtrados por `active`: sin `include_inactive` el backend ya deja afuera lo dado de baja (circuitos, rutinas y planificaciones), así que son los vigentes.
  - Músculos y Grupos musculares llevan a `/a/catalogo?seccion=musculos` y `/a/catalogo?seccion=grupos`: **T32 y T33 tienen que leer ese parámetro** para abrir el segmento que corresponde.
  - Estados: carga (un bloque en el lugar del número), y si un número no llega la tarjeta muestra "–" y el dato de apoyo vuelve al texto de la sección ("Planes sistémicos", "Edición y bajas"). Un aviso con "Reintentar" vuelve a pedir solo lo que falló. No hay estado vacío: un 0 es un dato.
  - Las queries comparten la key con la lista de cada sección (`queryKeys.exercises.list()`, `routines.list()`, `routines.circuits()`, `planifications.list()` y `coaches.list()`) y usan `select` para quedarse con el número. Las tareas que pidan esas listas con otros parámetros (T19 con `include_inactive`, T21, T23) tienen que sumarlos a su key para no pisar estas.
  - Mock: los listados públicos (`GET /exercise/all` y `GET /coach/all`) responden solo con la sesión de una cuenta de demo, porque no llevan token (`demoAccountForSession`); los de coach y admin (`/routine/circuit/all`, `/routine/all`, `/planification/all`) y el resumen de membresías, por el token falso, con el 403 de un guard para la cuenta de un alumno (`staffAccess`, en `src/mocks/access.ts`). Los listados no tienen todavía los filtros `keyword` y `type`: los suman las tareas de cada sección. El Admin de demo ve 34 usuarios, 16 ejercicios, 6 circuitos activos, 5 rutinas, 4 planes y 3 entrenadores activos.
  - Medido contra el prototipo en 390 y 1280 px: encabezado, las cuatro tarjetas, "Gestión" y cada fila coinciden (posición y tamaño). Verificado además contra un doble local que responde como el backend: los públicos van sin token y los demás con el del Admin. No contra el backend real.
- [x] **T47 · Usuarios (2 h)** · nueva · usa los endpoints de CU-E-01 a CU-E-03
  - Listado paginado con `GET /users/all`: búsqueda por `keyword` y chips Todos, Alumnos (`role=user`), Entrenadores (`role=coach`) e Inactivos (`active=false`), con contadores tomados del `total`.
  - Cada fila muestra nombre, email, rol y estado de la cuenta. El estado de la membresía del alumno va en la fila solo si sale de `GET /membership/status/users` (V1) sin un request por alumno; si no, va solo en el detalle.
  - Detalle en modal:
    - Alumno: planificación vigente (`GET /planification/user/{id}/active`; si todavía no responde, se omite hasta el bloque C2) y membresía (último pago). Acciones: Convertir en entrenador, que abre T36 con el alumno preseleccionado, y Desactivar o Reactivar cuenta (`POST /users/set-active/{id}`), con confirmación.
    - Entrenador: email profesional y CUIL. Acciones: Editar datos (T37) y Desactivar o Reactivar cuenta.
  - El prototipo muestra adherencia y "alumnos a cargo": no van, porque el backend no tiene esos datos ni un vínculo entrenador-alumno.
  - Cómo quedó: `UsersPage` en `/a/usuarios`, con `UserCounters`, `UserRow`, `UserDetailModal` (con `StudentDetails` y `CoachDetails`) y los chips Todos, Alumnos, Entrenadores e Inactivos. Está explicado en el README, sección "Usuarios del Admin".
  - **Código que se compartió con T15** (los hooks de datos de usuarios que usan varios roles viven en `features/account/hooks`): `useUsers` y `useUserCount` (de `GET /users/all`), `useSetUserActive` (`POST /users/set-active/{id}`; **T16 lo usa para cerrar la cuenta del alumno**), `useStudentsByMembershipStatus` (T17 usa el de un estado) y `useActiveUserPlanification`; el listado paginado `UserList` (`features/account/components`), `useSearchAndFilter` (`shared/lib`: búsqueda con debounce y chip copiados a la URL), `DetailList` (`shared/ui`) y `formatCuil`. Mis alumnos se rehízo sobre ellos: `useStudents` y `useStudentTotal` desaparecieron, y su comportamiento es el mismo.
  - Chips y contadores: Todos incluye también las cuentas de admin (así lo devuelve `GET /users/all` sin `role`), y Inactivos junta los de todos los roles. Los contadores (Alumnos, Entrenadores e Inactivos) salen del `total` de tres requests de un usuario y no cambian con la búsqueda. La búsqueda y el chip quedan en la URL (`?q=…&filtro=alumnos`).
  - **Membresía en la fila (V1 resuelto):** se muestra "· membresía activa", "por vencer" o "vencida" en los alumnos. Sale de `GET /membership/status/users`, que no tiene schema en el contrato: su forma sale del código del backend (`{ status, total, expiring_soon_days, students[] }`) y quedó tipada en `pending.ts` con `PENDIENTE-CONTRATO: V1`. Son **cuatro requests en total** (uno por estado, cada uno con todos los alumnos), no uno por alumno. Si alguno falla, a esos alumnos no se les dice la membresía y no se avisa nada. El backend los resuelve en memoria cada vez, así que si pesan, se saca de la fila sin tocar nada más: queda el detalle. Decisión de Fran.
  - Detalle en un modal, con "nombre y valor" (`DetailList`): el alumno muestra email, membresía (la del último pago, la misma query del historial: "Plan Mensual · Activa" o "Sin membresía") y, si el backend la respondió, la planificación vigente; el entrenador, email profesional y CUIL con máscara (`GET /coach/get/{id}`); el admin, solo el email.
  - **La planificación vigente hoy no responde:** el controller de `GET /planification/user/{id}/active` tiene el llamado al service comentado y el request queda colgado. El front lo corta a los 3,5 s (antes de los 4 s del aviso de arranque en frío) y omite la fila, como pide esta tarea. Cuando responda (bloque C2) se muestra "Fuerza · vigente hasta 16 Nov 2026": `UserPlanification` no trae el nombre del plan, solo tipo y fechas, y su forma final depende de B7.
  - Acciones: **Convertir en entrenador** (alumno activo) abre `/a/convertir?alumno=<id>`: T36 tiene que leer ese parámetro (hoy es una pantalla temporal). **Desactivar cuenta** pide confirmación, aclarando que es una baja lógica y que se puede reactivar; **Reactivar** no la pide. **Editar datos** del entrenador todavía no está: lo suma T37 a este modal. No se ofrece desactivar a los admins ni a la propia cuenta.
  - Hallazgos del backend, para Fran: (1) `setUserActive` no tiene ninguna restricción: un admin puede darse de baja a sí mismo o a otro admin, así que el front lo evita. (2) Solo cambia `User.active`: no toca `Coach.active`, por lo que "Entrenadores activos" del panel (T30) no baja cuando se desactiva la cuenta de un entrenador desde acá. (3) `GET /planification/user/{id}/active` cuelga (ver arriba).
  - Mock: el Admin de demo ve 34 usuarios: los 29 alumnos de T15, cuatro entrenadores (Diego, Carla, Martín y Andrea, esta última inactiva) y el admin. Se mockean `POST /users/set-active/{id}` (las bajas viven en memoria y se ven también en Mis alumnos), `GET /membership/status/users`, `GET /coach/get/{id}` y `GET /planification/user/{id}/active` (12 alumnos con planificación y el resto con 404, una forma inventada del "sin plan": a confirmar con B7). El mock de los pagos pasó a atender por el token de la cuenta de demo y responde por cualquier alumno de demo, según su estado de membresía, que sale de la misma fixture que el resumen de T15.
  - Medido contra el prototipo en 390 px: encabezado, contadores, buscador y fila (avatar, nombre, subtítulo y las dos píldoras, y la fila apagada del inactivo) coinciden. El nombre y el valor de `DetailList` no se reparten mitad y mitad como en el prototipo: el nombre ocupa lo que necesita y el valor, el resto, para que un email no se parta en dos líneas. Verificado contra un doble local que responde como el backend (token, parámetros, el 500 de una baja, el 404 de un entrenador, la planificación que cuelga), no contra el backend real.
- [x] **T31 · Ejercicios (2,5 h) · CU-A-01 a CU-A-06**
  - Tab propio (`/a/ejercicios`), ya no dentro de Catálogo: búsqueda por nombre y chips por grupo muscular.
  - Los chips salen de `/muscles/mg/all`, cruzado con `/exercise/ExMuscles/all` y `/muscles/all`. Ese cruce queda como hook compartido, porque la wiki (T28) lo reutiliza.
  - Editor en página (`/a/ejercicios/:id`):
    - Nombre y descripción.
    - Músculos como chips, con agregar y quitar. Cubre CU-A-02 y CU-A-03 mediante `exercised_muscles_ids`.
    - Tips de seguridad y de activación.
    - Video, imagen de vista previa (`preview_image`) e imagen de fondo (`bg_image`), como URLs. El botón "Subir imagen" del prototipo se reemplaza por esos campos.
    - El prototipo no tiene los tips de activación ni las dos imágenes: van porque están en el contrato.
  - Eliminar con confirmación, manejando el rechazo por integridad (V7).
  - Cómo quedó: `ExercisesPage` en `/a/ejercicios` (con `ExerciseRow`) y `ExerciseEditorPage` en `/a/ejercicios/nuevo` y `/a/ejercicios/:id` (con `ExerciseForm` y `MusclePickerModal`). Está explicado en el README, sección "Ejercicios del Admin".
  - **Desvío del plan (V9): el cruce no usa `/exercise/ExMuscles/all` ni `/muscles/all`.** El código del backend manda los músculos de cada ejercicio en `exercisedMuscles` (`GET /exercise/all` y `GET /exercise/{id}`) y los de cada grupo en `muscles` (`GET /muscles/mg/all`), que el Swagger no declara. Además esos dos endpoints devuelven otra forma que el contrato (`ExMuscles/all` no trae `exercise_id` ni `muscle_id`, y `muscles/all` no trae `muscle_group_id`): cruzar con los tipos del contrato habría funcionado con los mocks y roto contra el backend real. Con las dos queries alcanza: cada ejercicio es de los grupos a los que pertenecen sus músculos. Los tipos provisionales son `ExerciseWithMuscles`, `ExerciseMuscle` y `MuscleGroupWithMuscles` (`pending.ts`, `PENDIENTE-CONTRATO: V9`) y se piden con `request<T>`.
  - **Código compartido** (en `features/catalog/hooks`, una feature nueva para lo de ejercicios y músculos que usan varios roles): `useExercises` (y `exercisesQuery`, que el panel del Admin reutiliza para su contador), `useExercise`, `useMuscleGroups` y `useExerciseCatalog`, el cruce, que da cada ejercicio con sus `groups` y los grupos ordenados por nombre (el backend no los ordena). Además `matchesSearch` y `normalizeText` (`shared/lib/text.ts`, búsqueda sin mayúsculas ni acentos) y `useSearchAndFilter`, que ahora admite chips que salen de los datos (sin `values` acepta cualquier valor y la pantalla comprueba que exista).
  - **Listado:** el buscador filtra en el front (`GET /exercise/all` no tiene filtros, y no pagina) por nombre, sin acentos. Los chips son Todos y un grupo por cada grupo muscular. Un ejercicio aparece en todos los grupos de sus músculos (Peso muerto, en Espalda y en Piernas). La búsqueda y el grupo quedan en la URL (`?q=…&grupo=<id>`); un grupo que ya no existe se trata como Todos. Cada fila trae miniatura (la `preview_image`, o el ícono), nombre, sus músculos en una línea, Editar y Eliminar. Estados de carga, error con reintento (pide solo lo que falló), catálogo vacío (con "Crear ejercicio") y sin coincidencias.
  - **Editor** (CU-A-04 y CU-A-05, con CU-A-02 y CU-A-03): nombre (máx. 50), descripción (máx. 2000), músculos como chips con ✕ para quitar y "+ Agregar", que abre un modal con los músculos que faltan, agrupados por grupo; tips de seguridad y de activación (máx. 500); y tres links, el video, la imagen de vista previa y la de fondo (máx. 150, con http:// o https://). Agregar y quitar músculos es mandar la lista completa en `exercised_muscles_ids`: el backend agrega los que faltan y quita los que sobran. Al guardar vuelve a la lista con un aviso. Se precarga con `GET /exercise/{id}`; con un id que no existe, "No encontramos el ejercicio".
  - **Los datos opcionales no se pueden vaciar:** el DTO rechaza el texto vacío (`IsNotEmpty`) y, si el campo no viene, `editExercise` conserva el valor anterior. El front no manda los campos vacíos y, en la edición, deja un error ("El servidor no permite dejar vacío un dato ya cargado") si se vacía uno que ya tenía valor, para que no parezca que se borró. La descripción es opcional en el DTO pero la columna no admite vacío, así que el formulario la pide.
  - **Borrado (CU-A-06) y V7:** confirmación en rojo desde la lista. El backend no distingue el motivo: ante cualquier falla de integridad responde `500 { error: 'Error al eliminar el ejercicio' }`, y el front muestra un aviso con el motivo probable (RMs registrados o entrenamientos hechos con el ejercicio). Según las entidades, `Routine_Exercise` y `Exercised_Muscle` borran en cascada, `User_RM` no y `Routine_Exercise_Finished` lo impide (`RESTRICT`). **Difiere de CU-A-06**, que dice que no se elimina un ejercicio en uso: si solo está en circuitos o rutinas sin entrenar, el backend lo borra y lo saca de ellos. El diálogo lo avisa ("si está en circuitos, se quita de ellos"). A confirmar contra el backend real.
  - Hallazgos del backend, para Fran: (1) V9, arriba. (2) CU-A-04 pide nombre único y el backend no lo valida (la columna no es `unique`). (3) `POST /exercise/edit/{id}` responde 201 (el contrato dice 200). (4) El borrado de un ejercicio en uso borra de los circuitos (arriba). (5) Un campo opcional del ejercicio no se puede vaciar (arriba).
  - Mock: `GET /exercise/all` y `GET /muscles/mg/all` (públicos: solo con la sesión de una cuenta de demo), `GET /exercise/{id}` (por el token de la cuenta de demo) y `POST /exercise/create`, `POST /exercise/edit/{id}` y `DELETE /exercise/{id}` (solo el Admin de demo; el entrenador recibe el 403 de un guard). Los ejercicios viven en memoria: lo que se crea, edita o borra se ve en las demás pantallas hasta recargar. Son 16 ejercicios, seis grupos y diez músculos, los del prototipo; los tips los tienen solo algunos. Press de banca y Sentadilla están "en uso": borrarlos da el 500 de V7. Validan como el backend (400 por nombre vacío o de más de 50, sin músculos; 404 si un músculo no existe).
  - Cambio en `List` (`shared/ui`): las columnas pasaron a `minmax(0, 1fr)`. Con `1fr` (y con la columna implícita), una fila con un texto largo en una sola línea ensanchaba la columna más allá de la pantalla. Usuarios, medido a 1280 px, queda igual; Mis alumnos usa el mismo componente y no se midió de nuevo.
  - Diferencias con el prototipo: no tiene el botón "Subir imagen" ni los tips de activación; van como links y como campo, porque están en el contrato. Las imágenes y el video van al final del formulario y no arriba. La fila muestra los músculos y no "grupo · tipo" (el backend no tiene el tipo de movimiento). Los chips salen de los grupos del backend, ordenados por nombre, y no son los cinco fijos del prototipo.
  - Medido contra el prototipo en 390 y 1280 px: encabezado, buscador, fila (miniatura, nombre, subtítulo y los dos botones), botón flotante, y en el editor el encabezado, la altura de cada campo, los chips y el botón coinciden. Probado en el navegador con los mocks (chips, búsqueda, URL, validaciones, agregar y quitar músculos, alta, edición, borrado en uso y borrado correcto) y contra un doble local que responde con las formas del backend (los públicos van sin token y el resto con el del Admin; el body de la edición y del alta no lleva campos vacíos; el 500 de V7), no contra el backend real.
- [x] **T32 · Músculos (1 h) · CU-A-07 a CU-A-10**
  - Segmento "Músculos" de Catálogo, con búsqueda.
  - Alta y edición en un modal: nombre y grupo muscular, más la descripción y las imágenes opcionales del contrato.
  - Borrado con confirmación y manejo del rechazo por integridad.
  - Cómo quedó: `CatalogPage` en `/a/catalogo`, con los segmentos Músculos y Grupos musculares (`?seccion=musculos|grupos`, los accesos del panel) y un solo buscador para los dos, como el prototipo (`?q=…`). `MusclesSection` arma el segmento, con `MuscleRow` y `MuscleFormModal`. El segmento Grupos musculares lo completó la T33 dentro de `CatalogPage` (recibe el mismo `search`). Está explicado en el README, sección "Catálogo del Admin: músculos".
  - **Datos** (V9): el listado es `GET /muscles/all`, que el backend devuelve con el grupo anidado (`muscle_group: { id, name }`) y sin `muscle_group_id`, distinto del contrato. El tipo provisional es `MuscleWithGroup` (`pending.ts`, `PENDIENTE-CONTRATO: V9`) y se pide con `request<T>`. Los grupos del selector salen de `useMuscleGroups` (T31). Hook nuevo en `features/catalog`: `useMuscles`; y `groupTone`, el color de cada grupo, que el prototipo fija por nombre y acá sale del id.
  - **Listado:** el buscador filtra en el front por nombre, sin acentos (`GET /muscles/all` no tiene filtros ni páginas). Cada fila trae el ícono con el color del grupo, el nombre, el grupo, Editar y Eliminar. Estados de carga, error con reintento, catálogo vacío (con "Crear músculo") y sin coincidencias.
  - **Modal** (CU-A-08 y CU-A-09): nombre (máx. 50), grupo muscular, descripción y dos links (imagen y vista previa, máx. 150, con http:// o https://), los tres últimos opcionales. En el alta, el grupo arranca en el primero de la lista, como el prototipo. Sin grupos cargados, avisa y no deja guardar. **Borrar un dato opcional:** el DTO rechaza el texto vacío, pero `editMuscle` asigna lo que viene y `IsOptional` deja pasar `null`, así que el front manda `null` solo para los datos que ya tenían valor y se vaciaron. El contrato no lo declara y no lo probé contra el backend real: la edición va con `request`.
  - **Borrado (CU-A-10) y V7:** confirmación en rojo desde la lista, con cuántos ejercicios lo usan ("Lo usan 3 ejercicios: se quita de ellos"), que sale de `GET /exercise/all`. **Difiere de CU-A-10**, que dice que no se elimina un músculo en uso: `Exercised_Muscle` borra en cascada, así que el backend lo borra igual y el músculo desaparece de los ejercicios. Un rechazo sería un `500` genérico ("Error al eliminar el músculo"): el front lo muestra con un aviso.
  - Después de guardar o borrar se piden de nuevo los músculos, los grupos (traen sus músculos) y los ejercicios (traen los nombres).
  - Hallazgos del backend, para Fran: (1) V9, arriba. (2) CU-A-10 no se cumple: el borrado de un músculo en uso se hace y se lleva el vínculo con los ejercicios. (3) `POST /muscles/edit/{id}` responde 201 (el contrato dice 200). (4) `editMuscle` permite vaciar un dato mandando `null` (a confirmar); `editExercise`, en cambio, no.
  - Mock: `GET /muscles/all` y `GET /muscles/mg/all` (públicos: solo con la sesión de una cuenta de demo) y `POST /muscles/create`, `POST /muscles/edit/{id}` y `DELETE /muscles/{id}` (solo el Admin de demo). Los músculos y los grupos viven en memoria y los comparten los mocks de ejercicios: renombrar o borrar un músculo se ve en Ejercicios (el borrado hace la cascada). Son diez músculos y seis grupos, los del prototipo; algunos tienen descripción.
  - Diferencias con el prototipo: el modal suma la descripción y las dos imágenes (están en el contrato); el color del ícono sale del id del grupo y no de un mapa por nombre; los grupos se ordenan por nombre en el selector.
  - Medido contra el prototipo en 390 px: encabezado, segmentos, buscador, fila (ícono, nombre, grupo y los dos botones), botón flotante y, en el modal, el título y los campos Nombre y Grupo muscular coinciden. Probado en el navegador con los mocks (segmentos, búsqueda con acentos y URL, validaciones, alta, edición, vaciar un dato, borrado con y sin ejercicios, y el efecto en Ejercicios) y contra un doble local con las formas del backend (los públicos sin token, los demás con el del Admin, el body sin campos vacíos y `null` al vaciar, el 500 del borrado), no contra el backend real.
- [x] **T33 · Grupos musculares (1 h) · CU-A-11 a CU-A-15**
  - Segmento "Grupos musculares" de Catálogo, con la cantidad de músculos de cada grupo.
  - Alta y edición en un modal.
  - Detalle en un modal con los músculos del grupo (CU-A-12).
  - Borrado con confirmación y manejo del rechazo por integridad.
  - Cómo quedó: `GroupsSection` reemplaza el segmento temporal en `CatalogPage` (`?seccion=grupos`, con el mismo buscador que Músculos), con `GroupRow`, `GroupDetailModal` y `GroupFormModal`. Está explicado en el README, sección "Catálogo del Admin: grupos musculares".
  - **Datos:** el listado es `GET /muscles/mg/all` (T31), que ya trae los músculos de cada grupo (V9): de ahí salen la cantidad de cada fila y el detalle (CU-A-12), sin pedir `GET /muscles/mg/get/{id}`. Alta, edición y borrado con `POST /muscles/mg/create`, `POST /muscles/mg/edit/{id}` y `DELETE /muscles/mg/{id}`. El tipo provisional `MuscleGroupWithMuscles` ahora dice que el backend no manda `created_at` ni `updated_at`.
  - **Lista:** buscador por nombre sin acentos, grupos ordenados por nombre, y filas con el ícono de 44 px con degradé del color del grupo, el nombre en la tipografía de títulos y "N músculos". Tocar la fila abre el detalle; Editar y Eliminar son botones aparte (la fila no es un solo botón porque lleva otros adentro). Estados de carga, error con reintento, vacío (con "Crear grupo muscular") y sin coincidencias.
  - **Detalle** (CU-A-12): título con el nombre, "N músculos en este grupo" y la lista de músculos por nombre; un grupo sin músculos dice "Este grupo todavía no tiene músculos.".
  - **Modal de alta y edición** (CU-A-13 y CU-A-14): nombre (máx. 50) y dos links opcionales, imagen y vista previa (máx. 150, con http:// o https://). Vaciar un link que ya tenía valor manda `null`, igual que en Músculos (ahora con el helper `saveBody.ts`, que usan los dos).
  - **Borrado (CU-A-15) y V7:** un grupo con músculos no se puede eliminar, y el front lo sabe porque tiene la lista: en lugar de la confirmación muestra un aviso ("Pecho tiene 1 músculo: el servidor no deja eliminar un grupo mientras tenga músculos. Movelos a otro grupo o eliminalos primero") y no llama al backend. Uno sin músculos pide confirmación en rojo. Si el listado estaba viejo y el backend lo rechaza, es un `500` genérico y el front muestra un aviso con el motivo probable.
  - Hallazgos del backend, para Fran: (1) CU-A-15 sí se cumple (a diferencia de CU-A-06 y CU-A-10), pero el rechazo es un 500 sin motivo. (2) CU-A-13 pide nombre único y el backend no lo valida (la columna no es `unique`). (3) `POST /muscles/mg/edit/{id}` responde 201 (el contrato dice 200). (4) `editMuscleGroup` asigna lo que viene, así que `null` borra un link (a confirmar contra el backend real).
  - Mock: `POST /muscles/mg/create`, `POST /muscles/mg/edit/{id}` y `DELETE /muscles/mg/{id}` (solo el Admin de demo), sobre los mismos grupos en memoria que usan Músculos y Ejercicios: renombrar un grupo se ve en Músculos. Borrar un grupo con músculos da el 500 de V7. `GET /muscles/mg/all` pasó a ser un mock con la forma real (V9).
  - Diferencias con el prototipo: el modal suma los dos links (están en el contrato); el color del ícono sale del id del grupo; un grupo con músculos no pide confirmación, explica por qué no se puede eliminar (el prototipo lo borra).
  - Medido contra el prototipo en 390 px: la fila (alto, ícono, nombre, "N músculos" y los dos botones) y el modal de detalle (título, tarjeta de músculo y botón) coinciden. Probado en el navegador con los mocks (detalle con y sin músculos, búsqueda, validaciones, alta, edición, vaciar un link, aviso de un grupo con músculos, borrado correcto, y el nombre nuevo en Músculos) y contra un doble local con las formas del backend (los públicos sin token, los demás con el del Admin, el body sin campos vacíos y `null` al vaciar, y el 500 de un listado viejo), no contra el backend real.
- [x] **T34 · Membresías, tipos (1 h) · CU-A-20 a CU-A-23**
  - Tarjetas con nombre, duración, precio en pesos y cantidad de alumnos por tipo (`GET /membership/type/users`, V1).
  - Alta y edición en un modal.
  - Eliminar es una baja lógica con `set-active`; también se puede reactivar.
  - Cómo quedó: `MembershipTypesPage` en `/a/membresias`, con `MembershipTypeCard` y `MembershipTypeModal`. Está explicado en el README, sección "Tipos de membresía del Admin".
  - **Datos:** `GET /membership/all` (público) trae **todos** los tipos, también los dados de baja: la pantalla los muestra apagados, con "Inactiva", y en lugar de Eliminar tienen Reactivar. Los alumnos por tipo salen de `GET /membership/type/users` (V1, solo coach y admin), que no tiene un modo de pedir solo los números: trae a todos los alumnos agrupados por el tipo de su último pago, así que se pide una vez y, si falla, las tarjetas simplemente no dicen "N alumnos". Un tipo sin alumnos no figura en la respuesta: se muestra 0. Hooks nuevos en `features/account/hooks`: `useMembershipTypes` (que T18 reutiliza) y `useStudentCountByMembershipType`.
  - **Lista:** primero los activos y después los dados de baja, cada grupo de menor a mayor duración (el backend no ordena). Cada tarjeta trae el ícono, el nombre, "N días · N alumnos", Editar, Eliminar o Reactivar, y el precio en la tipografía de datos. Estados de carga, error con reintento y vacío (con "Crear membresía").
  - **Modal** (CU-A-21 y CU-A-22): nombre (máx. 50), precio (mayor a cero, hasta dos decimales y hasta 99.999.999,99, la columna es `decimal(10, 2)`) y duración (entero de días, de 1 en adelante), con las reglas de los DTOs. Al editar avisa que los cambios valen para los pagos nuevos: los ya registrados guardan su propia copia del nombre, la duración y el precio. Los campos numéricos son textos en el formulario y el schema los convierte.
  - **Eliminar (CU-A-23):** es la baja lógica de `POST /membership/set-active/{id}` con `active: false`, con confirmación en rojo que lo aclara y dice que se puede reactivar. Reactivar no pide confirmación (como T47). Después de cada cambio solo se pide de nuevo la lista de tipos: los alumnos por tipo y los pagos no cambian.
  - **Errores:** `createMembership` rechaza una duración que ya tiene otro tipo con un 400 `{ error: 'Ya existe una membresía con esa duración' }`; el front lo muestra como "Ya hay un tipo de membresía con esa duración" reconociendo ese texto del servidor.
  - Hallazgos del backend, para Fran: (1) CU-A-21 pide nombre único y el backend valida la **duración** (no el nombre) solo en el alta: `editMembership` no lo comprueba, así que se puede editar un tipo hasta repetir otra duración. (2) `POST /membership/edit/{id}` responde 201 (el contrato dice 200). (3) `POST /membership/payment/register` no valida `active`: un tipo dado de baja se puede seguir cobrando por la API. (4) CU-A-23 dice que un tipo en uso no se elimina "o se hace lógica": el backend hace siempre la baja lógica, que no depende de que haya pagos. (5) `GET /membership/type/users` no tiene schema (V1).
  - Mock: `POST /membership/create`, `POST /membership/edit/{id}` y `POST /membership/set-active/{id}` (solo el Admin de demo; el entrenador recibe el 403 de un guard) y `GET /membership/type/users` (coach y admin de demo), sobre los tipos en memoria que ahora muestra también `GET /membership/all`. Con las mismas reglas que el backend: 400 por una duración repetida en el alta, 404 por un id que no existe, validaciones de los DTOs. Los alumnos de demo ahora pagan distintos tipos (15 el mensual, 4 el trimestral, 4 el anual y 3 el semestral, que está dado de baja) y sus pagos y su estado de membresía lo reflejan; Franco y Lucía siguen con el mensual.
  - Diferencias con el prototipo: las tarjetas suman "Inactiva" y Reactivar para los tipos dados de baja (el prototipo los borra), el modal de edición suma la aclaración sobre los pagos ya registrados, y "Eliminar" dice que es una baja lógica.
  - Medido contra el prototipo en 390 px: encabezado, tarjeta (ícono, nombre, "N días · N alumnos", los dos botones y el precio), botón flotante y, en el modal, el título, los campos (Nombre, y Precio y Duración en dos columnas) y los botones coinciden. Probado en el navegador con los mocks (validaciones, duración repetida, alta, edición, cancelar, baja con confirmación, reactivar) y contra un doble local con las formas del backend (los públicos sin token y los demás con el del Admin, el body con números, el 400 de la duración repetida, y la query de alumnos por tipo fallando), no contra el backend real.
- [ ] **T35 · Entrenadores (1 h) · CU-A-16, CU-A-19**
  - Botón "Convertir alumno en entrenador" (T36).
  - Listado con nombre (V3), email profesional y estado, con las acciones Editar (T37) y Eliminar con confirmación.
  - Sin "alumnos a cargo", por lo mismo que en T47.
- [ ] **T36 · Convertir alumno en entrenador (1 h) · CU-A-17**
  - Búsqueda de alumnos activos que todavía no son entrenadores. Puede llegar con el alumno preseleccionado desde Usuarios (T47), con `?alumno=<id>`.
  - Email profesional y CUIL de 11 dígitos sin guiones. Se puede mostrar con máscara, pero se envía sin guiones (el placeholder del prototipo los tiene).
- [ ] **T37 · Editar entrenador (0,5 h) · CU-A-18**
  - Modal según B8. CU-A-18 habla de email profesional y CUIL; el prototipo edita nombre y email. Mandan el caso de uso y el contrato.
  - Fran indicó el 5/10 que los contratos del Admin están completos, pero en el Swagger del 3/10 este endpoint no figuraba. Si ya existe, es REAL; si no, queda con mock y se avisa en el PR.

### Semana 2 (11 al 17/10): circuitos y Entrenador con contrato existente

Los circuitos usan los mismos componentes para el Admin y para el Entrenador. Se construyen bajo las rutas del Admin (T19 y T20) y T48 los monta para el Entrenador.

- [ ] **T19 · Circuitos: listado (1,5 h) · CU-E-21**
  - `/a/circuitos`, con el aviso de que un circuito se usa en varias rutinas y los cambios se aplican en todas.
  - Búsqueda y chips Activos, Inactivos y Todos (`include_inactive`).
  - Tarjetas con los ejercicios (`all-plus`) y la cantidad de rutinas que usan el circuito. Ese conteo se calcula cruzando con `GET /routine/all-plus`, porque no hay endpoint que lo devuelva.
  - La baja y la reactivación van en el editor (T20), como en el prototipo.
- [ ] **T20 · Editor de circuito (4,5 h) · CU-E-22, CU-E-23, CU-E-24**
  - Nombre, tipo y descripción. El tipo es obligatorio en el contrato, aunque el prototipo no lo muestra.
  - Ejercicios en orden: agregar desde el catálogo con buscador, quitar y reordenar. Un ejercicio no se repite.
  - Por cada ejercicio, nota del coach y bloques de series con todos los campos a la vista (series, reps, peso, RPE o RIR, % de RM, AMRAP con tiempo y RM), con las validaciones de `CLAUDE.md`. El prototipo los simplifica a una cantidad de series y un tipo; manda la decisión del 3/10 de mostrar todos los campos.
  - Avisos: si el circuito se usa en más de una rutina, con sus nombres; si está inactivo, que no se puede agregar a rutinas nuevas.
  - Desactivar y Reactivar (CU-E-24), con confirmación.
  - Duplicar, sin CU propio: crea una copia con `POST /routine/circuit/create` y el sufijo "(copia)", y abre la copia.
  - Escritura real. Resolver V2.
  - La integración con el editor de rutina (volver a la rutina, sumar el circuito nuevo, reemplazar por la copia) se hace en T22.
- [x] **T15 · Mis alumnos (2 h) · CU-E-01, CU-E-02**
  - Listado paginado (cargar más) con búsqueda por `keyword` y debounce.
  - Chips Todos, Activos e Inactivos con el parámetro `active`, y sus contadores.
  - Botón de Membresías con badge de "por vencer", desde el summary.
  - Sin adherencia ni última sesión (eso es T45).
  - Puede reutilizar el listado de Usuarios del Admin (T47), filtrado a `role=user`.
  - Cómo quedó: `StudentsPage` en `/c/alumnos`, con `useStudents` (`GET /users/all?role=user`, de a 20), `StudentCounters`, `StudentList` y `MembershipsButton`. Está explicado en el README, sección "Mis alumnos".
  - Contadores: los de la fila Activos, Inactivos y Total del prototipo, que son lo que el plan llama "sus contadores" (los chips quedan como en el prototipo, sin número). Salen del `total` de dos requests de un alumno (`active=true` y `active=false`), y el total es la suma. Son de todos los alumnos: la búsqueda no los cambia.
  - Badge de Membresías: suma los alumnos **por vencer y vencidos** del summary, como el prototipo ("requieren atención"), y no solo los por vencer como dice este plan. Si Fran prefiere solo los por vencer, es una línea en `MembershipsButton`.
  - Búsqueda: el placeholder dice "por nombre o email" y no "por nombre" como el prototipo, porque CU-E-02 también busca en el email. Espera 300 ms sin teclas y recorta los espacios. La búsqueda y el chip se copian a la URL (`?q=…&estado=activos`) y se leen solo al abrir la pantalla: al volver del detalle con Atrás, la lista queda como estaba.
  - Se completó el encabezado de Mi cuenta (T13): "Entrenador · N alumnos activos" bajo el nombre, con la misma query que el contador de Activos. Con eso no queda nada pendiente de T13 y T14 en ese encabezado. El avatar de la barra superior de Mis alumnos (que lleva a Mi cuenta) es `AccountLink`, en `features/account`: T38 lo reutiliza.
  - `/c/alumnos/:id` tiene una pantalla temporal (`TEMPORAL (T16)`), para que tocar una fila no caiga en "Página no encontrada".
  - Mock: `GET /users/all` y `GET /membership/status/summary` atienden solo a las cuentas de demo (por su token falso) y el resto pasa al backend real. El entrenador de demo ve 29 alumnos (24 activos y 5 inactivos, para tener dos páginas) y 9 que requieren atención. `GET /users/all` imita al backend: filtra por rol, estado y texto, ordena del más nuevo al más viejo y valida la página y el límite.
  - Verificado contra un doble local que responde como el código del backend (guard, 400 por parámetros de más, filtros, 500, página siguiente que falla y vacío), no contra el backend real.
  - Para Fran, sobre el backend: `GET /users/all` está con `@Auth()` sin roles, así que cualquier usuario autenticado, también un alumno, puede listar los nombres y emails de todos. No afecta al front, pero conviene limitarlo a entrenador y admin. Además el summary de membresías cuenta a **todos** los alumnos, también a los de cuenta inactiva (`getStudentsWithMembershipStatus` filtra solo por rol): lo tienen que tener en cuenta T17 y T47 si muestran "alumnos activos" junto a esos números.
  - Para las tareas que siguen: `PageHeader.back` acepta un destino fijo, así que el "Volver" del detalle (T16) lleva a `/c/alumnos` sin la búsqueda; T16 puede volver con `navigate(-1)` si quiere conservarla. T47 puede reutilizar `useStudents` y `StudentList`: hoy tienen `role=user` fijo.
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
  - Resolver V1, si no quedó resuelto en T34 o T47.
- [ ] **T18 · Registrar pago (1 h) · CU-E-29**
  - Elegir alumno (o venir preseleccionado) y un tipo de membresía activo (`useMembershipTypes`, de T34, trae también los dados de baja y el backend no valida `active` al registrar el pago: el filtro es del front).
  - Resumen con precio y vigencia estimada, solo visual; el vencimiento real lo calcula el backend.
  - Al confirmar, se invalidan el summary, las listas y los pagos del alumno.
- [ ] **T48 · Circuitos y placeholders para el Entrenador (1 h)** · nueva · CU-E-21 a CU-E-24
  - Montar los componentes de T19 y T20 para el Entrenador, con el editor en `/c/circuitos/:id`.
  - Acceso a los circuitos: segmento Rutinas | Circuitos dentro del tab Rutinas, según la decisión del 3/10. Mientras Rutinas sea placeholder, el segmento Circuitos funciona y el de Rutinas muestra el placeholder de T46. El prototipo del 5/10 solo le muestra los circuitos al Entrenador desde el editor de rutina: a confirmar por Fran.
  - Placeholder de T46 en `/c/planes` y en el segmento Rutinas, hasta el bloque C2.
  - Verificar que los componentes no tengan nada propio del Admin.

### Semana 3 (18 al 24/10): contratos nuevos, Usuario sin dependencias y núcleo del Usuario

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
- [ ] **T28 · Wiki de ejercicios (1,5 h) · CU-U-15**
  - Búsqueda por nombre y filtro por grupo muscular, con el hook de cruce de T31 (`useExerciseCatalog`, en `features/catalog/hooks`), el buscador sin acentos (`matchesSearch`, en `shared/lib/text.ts`) y `useExercise` para la ficha.
  - Ficha con descripción, tips de seguridad y de activación, video (link) e imágenes.
  - Estado vacío.
- [ ] **T29 · Temporizador (1 h) · CU-U-14**
  - Presets de 30 s, 60 s, 90 s, 2 min y 3 min.
  - Iniciar, pausar y reiniciar.
  - Sigue corriendo si cambiás de pantalla.
  - Al llegar a cero, aviso visual y vibración si el dispositivo lo permite.
  - No persiste nada.
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

### Semana 4 (25 al 31/10): pendientes y backend real

Si el backend de rutinas y planificaciones ya está completo, el resto de la semana es para el bloque C2.

- [ ] **T43 · Historial de entrenamientos (1,5 h) · CU-E-06, CU-E-07**
  - En el detalle del alumno, en orden cronológico.
  - Filtro por ejercicio con peso, reps y fecha.
- [ ] **T44 · Pasar los mocks a backend real (2 h)**
  - Recorrer el registry y apagar los mocks de todo lo implementado, con una prueba rápida de cada pantalla. Incluye el flag real de contraseña temporal.
  - Dejar en el PR la lista de lo que sigue en mock.
- [ ] **T45 · Extras, solo si sobra tiempo**
  - Progreso del alumno, adherencia y última sesión en Mis alumnos, y timer del Entrenador.
  - Dependen de datos de B1 y B6; si esos datos no existen, no se hacen.

### Bloque C2: rutinas y planificaciones (cuando su backend esté completo)

Arranca cuando Fran avise que C2 está completo, y reemplaza los placeholders de T46 y T48. Va directamente contra el backend real, sin mocks, en este orden. Si arranca después del 31/10, entra en la primera semana de debug.

- [ ] **T21 · Rutinas: listado (1 h) · CU-E-15**
  - Reemplaza el placeholder de `/a/rutinas`: búsqueda, "incluir inactivas" y tarjetas con la cantidad de circuitos y ejercicios (`all-plus`).
- [ ] **T22 · Editor de rutina (3 h) · CU-E-16, CU-E-17, CU-E-18**
  - Nombre y nota del coach.
  - Circuitos en orden. Cada uno muestra sus ejercicios, cuántas rutinas lo usan y las acciones Editar (abre T20 y vuelve a la rutina) y Quitar.
  - Duplicar un circuito desde la rutina reemplaza al original en esa rutina.
  - "Agregar existente" elige entre los circuitos activos. "Nuevo circuito" abre T20 y, al guardar, suma el circuito a la rutina.
  - Un circuito se puede repetir. Mínimo 1, máximo 50.
  - Payload de edición con los ids de vínculo (reconciliación).
  - Eliminar es una baja lógica (CU-E-18), con confirmación. El prototipo dice que la rutina "se quita de las planificaciones"; según el contrato sigue apareciendo en las que la referencian, y así lo tiene que decir el aviso.
  - Contra el backend real.
- [ ] **T23 · Planificaciones: listado (1 h) · CU-E-08**
  - Reemplaza el placeholder de `/a/planes`: búsqueda, filtro por tipo e "incluir inactivas".
  - Tarjetas con la meta y lo asignado (`number_of_routines` y `routine_count`).
  - El prototipo muestra "N alumnos" por plan: no va, porque ningún endpoint lo devuelve.
- [ ] **T24 · Editor de planificación (3,5 h) · CU-E-09, CU-E-10, CU-E-11, CU-E-12a a CU-E-12d**
  - Datos del contrato:
    - Nombre.
    - Número de rutinas, obligatorio aunque el prototipo no lo tiene.
    - Descripción, que en el prototipo se llama "Notas del entrenador".
    - Tipo: texto de hasta 30 caracteres. Los chips del prototipo (Fuerza, Hipertrofia, Resistencia) sirven como sugerencias.
    - Duración: texto. El prototipo la pide en semanas.
  - Rutinas del plan en orden, con su id de asignación. Agregar una (con posición opcional) o varias en lote. Quitar o reincorporar una o varias, con posición opcional al reincorporar.
  - Eliminar es una baja lógica (CU-E-11). El aviso dice que no se quita a los alumnos que la tienen; el prototipo dice lo contrario.
  - Si el plan está inactivo, se bloquean los cambios de contenido con un aviso.
  - Contra el backend real.
- [ ] **T49 · Rutinas y planificaciones para el Entrenador (1 h)** · nueva · CU-E-08 a CU-E-18
  - Montar los componentes de T21 a T24 en `/c/rutinas`, `/c/rutinas/:id`, `/c/planes` y `/c/planes/:id`, reemplazando los placeholders de T48.
  - Acciones propias del Entrenador: "Asignar" en cada planificación (abre T41) y "Asignar a alumno" en el editor de rutina (abre T42).
- [ ] **T41 · Asignar planificación a alumno (2 h) · CU-E-13, CU-E-14**
  - Se entra desde la planificación o desde el alumno.
  - Fechas de inicio y fin, y nota del coach.
  - Aviso de solapamiento y confirmación, según B7.
  - Quitar el plan del alumno es una baja lógica, con confirmación.
- [ ] **T42 · Rutina puntual (1,5 h) · CU-E-19, CU-E-20**
  - Asignar una rutina a un alumno, según B5. Si ya la tiene, mostrar el error.
  - Quitar con confirmación.

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
| Dedicación cerca de 10 h por semana | Al 5/10 quedan ~56,5 h; con 10 h por semana entran ~37 h | La regla de recorte define qué se cae primero. |
| El rol `admin` no tiene permiso en endpoints del Entrenador (V8) | Usuarios, circuitos, rutinas y planificaciones del Admin no funcionan contra el backend real | T46 lo releva antes de construirlas. Si falta, se ajusta el guard en el backend o esas secciones quedan solo para el Entrenador. |
| El backend de rutinas y planificaciones (C2) no está completo el 31/10 | Esas secciones siguen con placeholder en el Admin y el Entrenador, y el bloque C2 (~13 h) cae en la ventana de debug | El resto del plan no depende de C2; Fran avisa apenas esté y el bloque se ejecuta en orden fijo. |
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
