/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NASA_API_KEY: string
  readonly VITE_OPENAI_API_KEY: string
  readonly VITE_AI_FEATURES_ENABLED: string
  readonly VITE_API_URL: string
  readonly VITE_DEV_MODE: string
  readonly VITE_LOG_LEVEL: string
  readonly VITE_PROD_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}