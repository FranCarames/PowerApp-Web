import type { MockEndpoint } from '../endpoint';

/**
 * Todos los mocks que existen, de todos los dominios. Cada tarea suma los suyos en
 * `handlers/<dominio>.ts` y los agrega acá, y los enciende en `registry.ts`. Desde T44 no hay ninguno.
 */
export const mocks: readonly MockEndpoint[] = [];
