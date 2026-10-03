// Descarga el JSON del Swagger del backend y lo guarda en src/api/openapi.json.
//
// Uso:
//   npm run api:fetch                    API_DOCS_URL, o http://localhost:3000/docs-json
//   npm run api:fetch -- <url-del-json>  la URL indicada
//
// El backend en Render (free tier) puede tardar más de un minuto en despertar,
// por eso el timeout es amplio.
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_URL = 'http://localhost:3000/docs-json';
const TIMEOUT_MS = 120_000;

const url = process.argv[2] ?? process.env.API_DOCS_URL ?? DEFAULT_URL;
const outputFile = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../src/api/openapi.json',
);

function fail(message) {
  console.error(`api:fetch: ${message}`);
  process.exit(1);
}

console.log(`Descargando el contrato desde ${url} ...`);

let response;
try {
  response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
} catch (error) {
  if (error.name === 'TimeoutError') {
    fail(
      `el servidor no respondió en ${TIMEOUT_MS / 1000} s. ¿Está apagado o dormido?`,
    );
  }
  const reason = error.cause?.code ?? error.cause?.message ?? error.message;
  fail(
    `no se pudo conectar (${reason}). ¿Está levantado el backend? Para otra URL: npm run api:fetch -- <url>`,
  );
}

if (!response.ok) {
  fail(`el servidor respondió ${response.status} ${response.statusText}.`);
}

let spec;
try {
  spec = await response.json();
} catch {
  fail('la respuesta no es un JSON válido. ¿La URL apunta a /docs-json?');
}

if (!spec?.openapi || !spec.paths) {
  fail('el JSON no parece un contrato OpenAPI (falta "openapi" o "paths").');
}

await mkdir(dirname(outputFile), { recursive: true });
await writeFile(outputFile, `${JSON.stringify(spec, null, 2)}\n`);
console.log(
  `Contrato guardado en src/api/openapi.json (${Object.keys(spec.paths).length} paths).`,
);
