/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WX_APPID?: string;
  readonly VITE_WX_REDIRECT_URI?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
