interface ImportMetaEnv {
  /** Origen del backend, sin /api/v1. En local queda vacía y se usa el proxy de Vite. */
  readonly VITE_API_URL?: string;
  /** "true" activa MSW para los endpoints marcados como mock en src/mocks/registry.ts. */
  readonly VITE_USE_MOCKS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
