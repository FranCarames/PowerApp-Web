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

3. Levantá el backend local en el puerto 3000, o activá los mocks con `VITE_USE_MOCKS=true`.

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

Las dependencias abiertas con el backend (B1 a B9, C1 a C3 y V1 a V7) están detalladas en la sección 4 de [`PLAN.md`](PLAN.md).

## Estructura del proyecto

```
src/
  app/            router, providers, AppShell (tab bar y sidebar)
  api/            client.ts, errors.ts, queryClient.ts, queryKeys.ts, types.ts, openapi.json (bajado del Swagger), schema.d.ts y publicOperations.ts (generados), pending.ts
  mocks/          browser.ts, registry.ts, handlers/<dominio>.ts, fixtures/
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

Static Site en Render, desplegado desde `main`:

- **Build:** `npm run build`
- **Publish:** `dist`
- **Rewrite:** `/*` a `/index.html`, para que recargar una ruta interna no dé 404.
- **Variables:** `VITE_API_URL` y `VITE_USE_MOCKS`.

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
