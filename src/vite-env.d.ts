/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WS_URL?: string;
}

declare global {
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

declare module '*.module.scss' {
  const classes: Readonly<Record<string, string>>;
  export default classes;
}
