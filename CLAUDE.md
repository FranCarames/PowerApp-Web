# PowerApp Web: lineamientos para Claude Code

Leé este archivo completo al empezar cada sesión. Las tareas, su orden y su estado están en `PLAN.md`.

## Qué es este proyecto

Front web de PowerApp, una app de gestión de gimnasio con tres roles: **Usuario** (alumno), **Entrenador** y **Admin**. Consume la API REST de PowerApp (NestJS + TypeORM + PostgreSQL), desplegada en Render. Es mobile-first: se usa sobre todo desde el celular en el gimnasio, y en escritorio se adapta.

El backend lo desarrolla Fran por separado. **Este repo nunca modifica el backend.**

## Fuentes de verdad

La documentación del proyecto vive en el repo **[PowerApp-Docs](https://github.com/FranCarames/PowerApp-Docs)** y **no se copia a este repo**. Leela desde su clon local. Si no lo tenés disponible en la sesión, usá GitHub: los archivos crudos están en `https://raw.githubusercontent.com/FranCarames/PowerApp-Docs/main/<ruta>` (los espacios de las rutas van como `%20`).

| Qué | Dónde | Regla |
|---|---|---|
| Casos de uso | PowerApp-Docs: `Use Cases/` (índice en `Use Cases/README.md`) | Cada pantalla implementa casos de uso concretos (CU-U-xx, CU-E-xx, CU-A-xx). Respetá también los caminos alternativos. |
| Diseño | PowerApp-Docs: `UI Front/powerapp-prototype-web.html` | Referencia visual: layout, tokens, componentes y textos. Su lógica y sus datos son de ejemplo; los datos reales salen de la API. |
| Modelo de datos | PowerApp-Docs: `Doc/PowerApp - Modelo DB.svg` (y `.pdf`) | Ante un conflicto con las entidades del backend, manda este modelo. |
| Decisiones de diseño por cambio | PowerApp-Docs: `Doc/specs/` y `Doc/plans/` | Explican el porqué de reglas del contrato (circuitos, rutinas, planificaciones, series realizadas). Consultalos antes de interpretar un caso dudoso. |
| Contrato de la API | Swagger del backend (`https://powerapp-backend.onrender.com/docs`), bajado a `src/api/openapi.json` con `npm run api:fetch` | Es la única fuente de los tipos de la API. Nunca escribas tipos de la API a mano. |
| Plan | `PLAN.md`, en este repo | Orden de las tareas, alcance de cada una y estado. |

- **No modifiques PowerApp-Docs desde las tareas del front.** Si encontrás un error o un hueco en la documentación, avisalo en el resumen de la tarea.
- **`Status/` de PowerApp-Docs es una copia** que se sincroniza a mano desde el backend y puede estar desactualizada. No la uses para decidir qué endpoints funcionan: para eso está el Swagger.
- Si el prototipo contradice a un caso de uso o al contrato, mandan el caso de uso y el contrato. Avisá la diferencia en el resumen de la tarea.

## Stack

No agregues dependencias fuera de esta lista sin aprobación de Fran.

| Área | Herramienta |
|---|---|
| Lenguaje | TypeScript en modo estricto |
| Interfaz | React |
| Build | Vite |
| Tipos de la API | `openapi-typescript`, generados desde `src/api/openapi.json` |
| Mocks | MSW (Mock Service Worker) |
| Cliente HTTP | `fetch` nativo con un wrapper propio en `src/api/client.ts` |
| Datos del servidor | TanStack Query |
| Sesión | Context de React + `localStorage` |
| Navegación | React Router |
| Formularios | React Hook Form + Zod |
| Estilos | CSS Modules + variables CSS |
| Calidad | ESLint + Prettier |

No uses Tailwind, Redux, Zustand, axios ni librerías de componentes de UI.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción en `dist/` |
| `npm run preview` | Sirve el build localmente |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
| `npm run api:fetch` | Descarga el JSON del Swagger del backend local a `src/api/openapi.json`. La URL sale de `API_DOCS_URL` (por defecto `http://localhost:3000/docs-json`; ajustala si tu server usa otro puerto o ruta). |
| `npm run api:gen` | Genera `src/api/schema.d.ts` (los tipos) y `src/api/publicOperations.ts` (los endpoints que no piden token) desde `src/api/openapi.json` |

Antes de dar una tarea por terminada, `typecheck`, `lint` y `build` tienen que pasar sin errores.

## Variables de entorno

| Variable | Uso |
|---|---|
| `VITE_API_URL` | Origen del backend, sin `/api/v1`. En Render: `https://powerapp-backend.onrender.com`. En local queda vacía y se usa el proxy de Vite. |
| `VITE_USE_MOCKS` | `true` activa MSW para los endpoints marcados como mock en `src/mocks/registry.ts`. |
| `API_PROXY_TARGET` | Solo del servidor de desarrollo. A dónde reenvía Vite las requests a `/api`. Por defecto, `http://localhost:3000`. |

En desarrollo, Vite hace proxy de `/api` al backend local (`http://localhost:3000`, o `API_PROXY_TARGET`). Así se evita CORS en local.

## Estructura de carpetas

```
src/
  app/            router, providers, AppShell (tab bar y sidebar)
  api/            client.ts, errors.ts, queryClient.ts, queryKeys.ts, types.ts, openapi.json (bajado del Swagger), schema.d.ts y publicOperations.ts (generados), pending.ts
  mocks/          browser.ts, registry.ts, handlers/<dominio>.ts, fixtures/
  features/
    auth/         login, registro, recuperar y cambiar contraseña
    account/      Mi cuenta, compartida por los tres roles, y los hooks de datos de usuarios que usan varios roles
    catalog/      Ejercicios y músculos que leen varios roles (hooks); lo propio de cada rol vive en su feature
    user/         pantallas del rol Usuario
    coach/        pantallas del rol Entrenador
    admin/        pantallas del rol Admin
  shared/
    ui/           componentes base
    icons/        íconos SVG del prototipo como componentes
    lib/          formato de números, fechas y moneda; helpers
    styles/       tokens.css, global.css
```

Cada feature organiza su código en `pages/`, `components/` y `hooks/`. Los hooks envuelven las queries y mutaciones de TanStack Query.

## API

- **Paths:** los paths del contrato ya incluyen `/api/v1`. Usalos tal cual figuran en `openapi.json`.
- **Token:** el login y el registro devuelven el JWT en el **header `Authorization` de la respuesta**, no en el body. Guardalo en `localStorage`, en la clave `powerapp.session`, junto con el `User`. En los endpoints con `security: bearer`, mandá `Authorization: Bearer <token>`: el cliente (`src/api/client.ts`) ya lo hace, y el token del login se lee con `readAuthToken(response)`.
- **Llamadas:** los endpoints del contrato se llaman con `api.get`, `api.post` y `api.delete`, que están tipados con `schema.d.ts`; si hace falta la respuesta (el login), con `apiRequest`. Lo que el contrato no tiene (`pending.ts`) o describe mal se llama con `request<T>`. Pasá el `signal` de la query.
- **401:** cierra la sesión (limpiala y redirigí a `/login`) un 401 de **guard**: el cuerpo trae `statusCode`. Un 401 de **negocio** (`{ error }`, sin `statusCode`) es un error del formulario y no la cierra: el de "La contraseña actual es incorrecta" al cambiar la contraseña. Cuenta solo un 401 de un request que llevaba token (`ApiError.authenticated`): el 401 del login es "credenciales inválidas". El 403 con "La cuenta está deshabilitada." también cierra la sesión; el de "Permisos insuficientes", no. Lo decide `isSessionExpiredError` en `src/api/errors.ts`.
- **Login con 403:** la cuenta está inactiva. Mostrá un mensaje específico.
- **Login con credenciales inválidas:** mostrá un mensaje genérico, sin decir qué campo falló.
- **Errores en general:** traducí 400, 404 y 409 a mensajes en español, en el formulario o en un toast. Nunca muestres el error crudo del servidor. Los errores llegan como `ApiError`, y `getErrorMessage(error, { 409: '…' })` (`src/api/errors.ts`) da el texto, con los de por defecto y los de cada pantalla.
- **Arranque en frío:** el backend corre en el free tier de Render y se duerme. Si una request tarda más de 4 segundos (`COLD_START_HINT_MS`), mostrá "Despertando el servidor, puede tardar un poco…" sin cortar la request.
- **Hooks:** cada endpoint se consume desde un hook en `features/<x>/hooks`. Las query keys van centralizadas en `src/api/queryKeys.ts`. Después de cada mutación, invalidá las queries afectadas.

## Mocks (MSW)

- `src/mocks/registry.ts` lista cada endpoint (método + path) con `mock: true | false`. Con `VITE_USE_MOCKS=true`, MSW intercepta solo los marcados como mock y el resto va al backend real.
- Los fixtures se tipan con los tipos generados. Usá datos realistas en español, por ejemplo los nombres del prototipo.
- **Endpoints sin contrato:** sus tipos provisionales van en `src/api/pending.ts`, cada uno con el comentario `// PENDIENTE-CONTRATO: <id de dependencia del PLAN> <CU>`. Cuando el contrato aparezca en `openapi.json`, borrá el provisional, regenerá los tipos y ajustá el código.
- **No inventes endpoints reales:** un endpoint que no está en `openapi.json` solo puede existir como mock pendiente.

## Diseño

Tokens, copiados del prototipo. Van en `src/shared/styles/tokens.css`:

```css
:root{
  --base:#0B0D16;--card:#13161F;--el:#1B1F2E;--border:#232739;--border2:#2E3347;
  --pri:#E8450A;--priL:#FF6B3D;--acc:#8B5CF6;
  --tp:#F5F1EB;--ts:#8892A8;--tm:#5B6280;
  --ok:#22C55E;--warn:#F59E0B;--err:#EF4444;
  --okS:rgba(34,197,94,.12);--warnS:rgba(245,158,11,.12);--errS:rgba(239,68,68,.12);
  --priS:rgba(232,69,10,.12);--accS:rgba(139,92,246,.14);
  --fD:"Barlow Condensed","Arial Narrow",system-ui,sans-serif;
  --fB:"Inter",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
  --fM:"JetBrains Mono",ui-monospace,"SF Mono",Menlo,Consolas,monospace;
  color-scheme:dark;
}
```

- **Tipografías:** se cargan desde Google Fonts. Barlow Condensed (600, 700, 800) para títulos, Inter (400 a 800) para el cuerpo y JetBrains Mono (500, 700, 800) para datos numéricos.
- **Mobile-first:** en mobile, el contenido va en un contenedor de hasta 560 px con tab bar inferior. Desde 960 px, la tab bar se reemplaza por una sidebar de 264 px, el contenido llega hasta 940 px y las listas pasan a dos columnas.
- **Modales:** bottom sheet en mobile, diálogo centrado en desktop.
- **Safe areas:** el `index.html` declara `viewport-fit=cover`. El layout respeta `env(safe-area-inset-*)`.
- **Accesibilidad:** `:focus-visible` visible, `aria-label` en los botones de ícono, `prefers-reduced-motion` respetado y contraste de texto como en el prototipo.
- **Textos:** español rioplatense con voseo ("Ingresá", "Guardá"), como en el prototipo.
- **Formatos:** números en formato es-AR, montos en pesos argentinos y pesos en kg con hasta 2 decimales.
- **Estados:** toda pantalla con datos tiene estado de carga, vacío y error.
- **Imágenes:** se cargan como campos de URL, porque el backend no tiene endpoint de subida.

## Navegación y rutas

| Rol | Tabs | Notas |
|---|---|---|
| Usuario | Rutina, RMs, Timer, Perfil | Progreso se suma solo si sobra tiempo (T45). |
| Entrenador | Alumnos, Planes, Rutinas, Perfil | Rutinas tiene segmentos Rutinas \| Circuitos. Se entra a Membresías desde un botón con badge en la top bar de Mis Alumnos. |
| Admin | Inicio, Usuarios, Ejercicios, Rutinas, Más (tab bar de mobile) | En desktop, la barra lateral tiene tres grupos: Inicio, Usuarios y Entrenadores; "Entrenamiento" (Ejercicios, Circuitos, Rutinas y Planificaciones); y "Configuración" (Catálogo, Membresías y Perfil). "Más" (`/a/mas`) lleva a Planificaciones, Circuitos, Entrenadores, Catálogo, Membresías y Mi cuenta, y queda marcada en toda pantalla que no esté en la tab bar. Catálogo tiene segmentos Músculos \| Grupos musculares. Músculos, grupos, tipos de membresía (alta y edición) y la edición de entrenadores van en modales, sin ruta propia. Rutinas y Planificaciones muestran un placeholder hasta el bloque C2. |

Rutas:

- **Auth:** `/login`, `/registro`, `/recuperar`, `/cambiar-contrasena`.
- **Usuario:** `/u/plan`, `/u/rutina/:id`, `/u/ejercicio/:id`, `/u/rms`, `/u/calculadora`, `/u/wiki`, `/u/wiki/:id`, `/u/timer`.
- **Entrenador:** `/c/alumnos`, `/c/alumnos/:id`, `/c/membresias`, `/c/pago`, `/c/planes`, `/c/planes/:id`, `/c/rutinas`, `/c/rutinas/:id`, `/c/circuitos/:id`.
- **Admin:** `/a/inicio`, `/a/usuarios`, `/a/entrenadores`, `/a/convertir`, `/a/ejercicios`, `/a/ejercicios/:id`, `/a/circuitos`, `/a/circuitos/:id`, `/a/rutinas`, `/a/rutinas/:id`, `/a/planes`, `/a/planes/:id`, `/a/catalogo`, `/a/membresias`, `/a/mas`.
- **Cuenta (los tres roles):** `/cuenta`, `/cuenta/datos`, `/cuenta/pagos`. El historial de pagos solo se muestra para el rol Usuario.

Las rutas de alta usan `nuevo` como id, por ejemplo `/c/circuitos/nuevo`.

**Guards:** cada ruta exige su rol. Al loguearse, cada rol va a su home: `user` a `/u/plan`, `coach` a `/c/alumnos` y `admin` a `/a/inicio`. Si la sesión tiene cambio de contraseña pendiente, la única ruta permitida es `/cambiar-contrasena`.

## Reglas de dominio que no se pueden romper

- **Bajas lógicas:** se hacen con `POST .../set-active/:id` y `{ "active": false }` en usuarios, membresías (tipos), planificaciones, rutinas, circuitos y asignaciones rutina-planificación. Antes de ejecutarlas, pedí confirmación aclarando que es una baja lógica. Donde aplique, ofrecé reactivar.
- **Borrado físico:** `DELETE` existe solo para RMs, ejercicios, músculos y grupos musculares. El backend puede rechazarlo por integridad referencial; en ese caso, mostrá el motivo.
- **Alumnos:** no existe vínculo entrenador-alumno. "Alumnos" son los usuarios con `role=user`. `GET /users/all` pagina con `{ data, total, page, limit, totalPages }`.
- **Circuitos:** son piezas independientes y reutilizables. Editar un circuito afecta a todas las rutinas que lo usan, así que avisalo antes de guardar. Un ejercicio no se puede repetir dentro de un circuito. Un circuito sí puede repetirse dentro de una rutina.
- **Edición por lista completa:** `EditRoutineDto.circuits` y `EditCircuitDto.exercises` reemplazan la lista entera. En rutinas, un ítem con `id` (el id del Routine_Circuit, no el del circuito) es un vínculo que se mantiene. Un ítem sin `id` es un vínculo nuevo. Lo que no se manda se da de baja.
- **Nota del coach al editar una rutina:** si se omite `coach_note`, la nota se borra. Mandá siempre el valor actual.
- **Series:** cada fila es un bloque de series iguales: `set_count: 3` con `rep_count: 8` es "3×8".
  - `rpe` y `rir` son mutuamente excluyentes.
  - `amrap_time` solo vale con `amrap: true`. Con `amrap: true`, `rep_count: 1` significa "sin objetivo".
  - `rm: true` exige `set_count: 1`.
  - Rangos: `set_count` de 1 a 20, `rep_count` de 1 a 1000, `weight` de 0.01 a 1000, `rpe` de 1 a 10, `rir` de 0 a 10 y `rm_perc` de 1 a 125.
  - El editor muestra todos los campos a la vista.
- **Planificación:** `number_of_routines` es la meta que declara el entrenador y `routine_count` es lo que efectivamente está asignado. Mostrá los dos.
- **Rutinas dentro de un plan (Routine_Asignation):** su id no es el de la rutina.
  - `order` puede repetirse.
  - Quitar una rutina le borra el `order` y no renumera al resto.
  - Al reincorporarla, el `order` es opcional; sin `order`, va al final.
  - Mandar `order` con `active: false` devuelve 400.
- **RM potencial:** se calcula con `POST /user_rm/potential` (Epley, tabla de 1RM a 12RM) y nunca se guarda. Mostrá ese aviso. Los RM registrados se guardan en `User_RM` (alta, edición, lectura y borrado).
- **Membresías:**
  - Los estados son `active`, `expiring_soon`, `expired` y `no_payments`. La ventana de "por vencer" la define `expiring_soon_days` en el summary.
  - Registrar un pago manda solo `user_id` y `membership_id`; el vencimiento lo calcula el backend.
  - "Eliminar" un tipo de membresía es una baja lógica.
- **Recuperar contraseña:** mostrá el mismo mensaje de confirmación exista o no el email.
- **Contraseña temporal:** si el login indica que se usó la temporal, forzá el cambio de contraseña antes de cualquier otra pantalla. El flag está pendiente de contrato (B9 en PLAN).
- **Registro:** siempre manda `role: user`. Después del alta, volvé al login, como indica CU-U-01.
- **Contraseñas:** validá con las reglas del DTO: mínimo 6 caracteres y máximo 50.
- **CUIL** (al convertir un alumno en entrenador): se envía con 11 dígitos sin guiones. Se puede mostrar con máscara.

## Convenciones de código

- Identificadores en inglés, como en el backend. Textos de interfaz en español. Comentarios en español, solo cuando aportan.
- Componentes funcionales en PascalCase, uno por archivo, con su CSS Module al lado (`Button.tsx` y `Button.module.css`).
- Sin `any` y sin `@ts-ignore`.
- Cada formulario tiene un schema de Zod que replica las reglas del DTO correspondiente.
- Reutilizá los componentes de `shared/ui`. Si falta uno, agregalo ahí y no en la feature.

## Flujo de trabajo por tarea

1. Fran indica la tarea del plan, por ejemplo "hacé la T26".
2. Leé en `PLAN.md` el alcance y el criterio de "listo" de la tarea. Después leé en PowerApp-Docs los casos de uso que referencia y la sección del prototipo que corresponde.
3. Creá la rama `feature/T26-mis-rms` desde `develop`.
4. Implementá solo el alcance de la tarea. Si falta algo del contrato, usá tipos pendientes y mocks, y avisalo. No toques el backend.
5. Corré `typecheck`, `lint` y `build`.
6. Entregá un resumen con:
   - Qué se hizo.
   - Qué endpoints usa y cuáles son reales o mock.
   - Cómo probarlo a mano.
   - Qué quedó pendiente.
   - Diferencias encontradas con el prototipo.
7. En el mismo PR, marcá la tarea como hecha en `PLAN.md`.
8. Fran revisa y mergea a `develop`. Los releases van de `develop` a `main`, y Render despliega `main`.
