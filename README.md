# PowerApp Web

Front web de **PowerApp**, una app de gestión de gimnasio con tres roles: **Usuario** (alumno), **Entrenador** y **Admin**. Consume la API REST de PowerApp (NestJS + TypeORM + PostgreSQL), desplegada en Render.

Es mobile-first: se usa sobre todo desde el celular en el gimnasio, y en escritorio se adapta.

> **Estado:** en desarrollo. El scaffolding (T01) está hecho; el resto de las tareas y su estado están en [`PLAN.md`](PLAN.md). Entrega final: **20/11/2026**.

## Qué hace cada rol

| Rol | Qué puede hacer | Tabs |
|---|---|---|
| **Usuario** | Ver su plan semanal y sus rutinas, marcar series, dejar notas, registrar y consultar sus RMs, calcular RMs potenciales, consultar la wiki de ejercicios, usar el temporizador y ver su historial de pagos. | Rutina, RMs, Timer, Perfil |
| **Entrenador** | Gestionar alumnos, circuitos, rutinas y planificaciones, asignarlas a los alumnos y controlar las membresías y los pagos. | Alumnos, Planes, Rutinas, Perfil |
| **Admin** | Administrar el catálogo (ejercicios, músculos y grupos musculares), los tipos de membresía y los entrenadores. | Inicio, Catálogo, Coaches, Perfil |

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

Las dependencias abiertas con el backend (B1 a B9, C1 a C3 y V1 a V7) están detalladas en la sección 4 de [`PLAN.md`](PLAN.md).

## Sesión, guards y arranque en frío

- **La sesión** (token y usuario) vive en `src/features/auth/sessionStore.ts`: en memoria y en `localStorage` (clave `powerapp.session`), que se lee una sola vez, al cargar la página. `useAuth()` la expone.
- **Cierre automático:** un 401 en un request que llevaba token, o un 403 con "La cuenta está deshabilitada.", cierran la sesión, vacían el caché de TanStack Query y muestran un aviso; los guards llevan a `/login`. El 403 de "Permisos insuficientes" no la cierra. Si la sesión cambió mientras el request estaba en vuelo (otro login, un cierre), su error no toca la sesión nueva.
- **Guards:** `RequireRole` (cada zona exige su rol; quien tiene otro vuelve a su inicio), `RequireSession` (`/cambiar-contrasena`) y `PublicRoute` (login, registro, recuperar y las direcciones que no existen).
- **Cambio de contraseña pendiente:** `session.passwordChangeRequired`, que marca el login (el campo de la respuesta es B9, todavía sin contrato). Con eso la única ruta permitida es `/cambiar-contrasena`, incluso después de recargar. `completePasswordChange()` libera el guard.
- **Arranque en frío:** si un request pasa de 4 segundos (`COLD_START_HINT_MS`, en `src/api/coldStart.ts`) sin que el backend conteste, aparece arriba "Despertando el servidor, puede tardar un poco…", sin cortar el request. Se va cuando el backend contesta (con lo que sea, menos 502, 503 o 504) o 3 segundos después del último request que falló sin respuesta, para que no parpadee mientras TanStack Query reintenta.
- **Para probarlo en desarrollo**, `/dev/api` tiene un probe que manda el token de la sesión a un endpoint protegido (con una cuenta de demo da 401 y cierra la sesión, porque su token es falso) y otro de respuesta lenta, que pide `/__dev/slow` (lo sirve Vite, solo en desarrollo, y anda solo con `VITE_API_URL` vacía).

## Login

- **Pantalla:** `/login` (`src/features/auth/pages/LoginPage.tsx`). El formulario usa React Hook Form con el schema `loginSchema` (`features/auth/schemas.ts`), que replica `LoginUserDto`: email de hasta 50 caracteres y contraseña de 6 a 50. El resolver de Zod es propio (`shared/lib/zodResolver.ts`), porque `@hookform/resolvers` no está en el stack.
- **Llamada:** `useLogin()` hace `POST /users/login` (real) y arma la `Session`: el token sale del header `Authorization` de la respuesta y el usuario, del body. No abre la sesión: eso lo hace la pantalla con `signIn`, y después navega con `homePathFor(session)`. Si la respuesta no trae el token (con el backend real, falta C1), no se abre nada y se avisa.
- **Errores:** un 401 dice "El email o la contraseña no son correctos." (no aclara cuál falló) y un 403, "Tu cuenta está cerrada…". Para red, 400 y 5xx valen los textos de `getErrorMessage`. Tras un 401 se vacía la contraseña y el foco vuelve a ella.
- **Contraseña temporal (B9):** el contrato todavía no informa que se entró con una temporal. El front lee `password_change_required` de la respuesta (tipo provisional `LoginResponse` en `src/api/pending.ts`; el nombre es una propuesta que se ajusta cuando el contrato exista). Si es `true`, la sesión **no se abre**: aparece el modal bloqueante "Actualizá tu contraseña" y, recién al tocar su botón, se abre con `passwordChangeRequired` y se va a `/cambiar-contrasena`. Si se abriera antes, el guard de `PublicRoute` llevaría a esa pantalla sin que el modal llegue a verse.
- **Cuentas de demo (mocks):** con `VITE_USE_MOCKS=true`, `POST /users/login` está en el registry y responde las cuentas de `src/mocks/fixtures/users.ts`: una por rol, una con contraseña temporal y una cerrada. Todas comparten la misma contraseña, que está en ese archivo. Cualquier otro email pasa al backend real (`passthrough`), así que las cuentas de verdad entran igual. El token de las cuentas de demo es falso: sirven para recorrer pantallas con datos mockeados, y un endpoint real las rechaza con 401 y cierra la sesión.

## Registro

- **Pantalla:** `/registro` (`src/features/auth/pages/RegisterPage.tsx`), con `registerSchema` (`features/auth/schemas.ts`), que replica `CreateUserDto`. Todos los campos son obligatorios: nombre y apellido de hasta 50 caracteres, email de hasta 50, código de país de hasta 10, teléfono de hasta 20 y contraseña de 6 a 50. `role` no es un campo del formulario: `useRegister()` siempre manda `role: 'user'`.
- **Contraseña (V5):** el prototipo pide 8 caracteres con mayúscula y número, pero el DTO acepta desde 6 y el front valida con el DTO. Subir la regla es un cambio de backend.
- **Después del alta (V6):** `POST /users/register` devuelve un token, pero CU-U-01 pide volver al login. El front lo ignora: no abre sesión y navega a `/login` con un aviso.
- **Email ya registrado:** el backend responde 409 con `{ error: 'Ya existe un usuario con ese email' }`. La pantalla muestra un aviso con links a `/login` y `/recuperar`, deja el foco en el email y conserva lo escrito. Los demás errores usan `getErrorMessage`.
- **Teléfono:** son dos controles bajo una etiqueta: el código de país (arranca en `+54`) y el número. La etiqueta "Teléfono" es la del número, y el código tiene su propio `id` y `aria-label`. Se muestra un solo mensaje de error, el del primero que falle.
- **Sin mock:** `POST /users/register` es real. Con el backend sin responder, el alta avisa que no pudo conectarse.

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
    account/      Mi cuenta, compartida por los tres roles
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
| Semana 1 | 3 al 10/10 | Fundaciones, Auth, Mi cuenta |
| Semana 2 | 11 al 17/10 | Entrenador con contrato existente |
| Semana 3 | 18 al 24/10 | Contratos nuevos, Usuario sin dependencias, Admin |
| Semana 4 | 25 al 31/10 | Núcleo del Usuario, pendientes del Entrenador, paso a backend real |
| Debug | 1 al 20/11 | Pruebas manuales, corrección, documentación |
| Entrega final | 20/11 | — |

Las pruebas son manuales, con el checklist del apéndice A de [`PLAN.md`](PLAN.md). No hay tests automatizados.
