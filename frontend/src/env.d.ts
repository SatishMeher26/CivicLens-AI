/// <reference types="vite/client" />

interface ImportMetaEnv {
  VITE_API_BASE_URL?: string;
  // other env vars can be added here
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
