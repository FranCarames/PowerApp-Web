// Genera src/api/publicOperations.ts: las operaciones del contrato que no piden token, o sea las
// que no declaran `security`. El cliente de la API no les manda Authorization.
//
// Lo corre `npm run api:gen`, después de openapi-typescript, a partir de src/api/openapi.json.
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const specFile = resolve(root, 'src/api/openapi.json');
const outputFile = resolve(root, 'src/api/publicOperations.ts');

const METHODS = [
  'get',
  'put',
  'post',
  'delete',
  'patch',
  'head',
  'options',
  'trace',
];

const spec = JSON.parse(await readFile(specFile, 'utf8'));
if (!spec?.paths) {
  console.error('api:gen: src/api/openapi.json no parece un contrato OpenAPI.');
  process.exit(1);
}

const publicOperations = [];
let total = 0;
for (const [path, item] of Object.entries(spec.paths)) {
  for (const method of METHODS) {
    const operation = item[method];
    if (!operation) continue;
    total += 1;
    // `security: []` también significa "sin token". Si la operación no lo declara, vale el global.
    const security = operation.security ?? spec.security ?? [];
    if (security.length === 0) publicOperations.push(`${method} ${path}`);
  }
}
publicOperations.sort();

const entries = publicOperations.map((operation) => `  '${operation}',`);
await writeFile(
  outputFile,
  `/**
 * Generado por scripts/gen-public-operations.mjs a partir de src/api/openapi.json.
 * No se edita a mano: se regenera con \`npm run api:gen\`.
 *
 * Las operaciones del contrato que no piden token. Cada entrada es "<método> <path>", con el path
 * tal como figura en \`paths\` (con las llaves de los parámetros: /api/v1/users/get/{id}).
 */
export const PUBLIC_OPERATIONS: ReadonlySet<string> = new Set([
${entries.join('\n')}
]);
`,
);
console.log(
  `Operaciones públicas guardadas en src/api/publicOperations.ts (${publicOperations.length} de ${total}).`,
);
