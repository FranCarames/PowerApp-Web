/**
 * Origen del backend, sin /api/v1 (los paths del contrato ya lo traen) y sin barra final.
 * Vacío en local: las requests van al mismo origen y Vite las reenvía al backend.
 */
export const API_URL = (import.meta.env.VITE_API_URL ?? '')
  .trim()
  .replace(/\/+$/, '');
