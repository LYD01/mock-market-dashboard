/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WS_URL?: string;
  readonly VITE_DATA_SOURCE?: 'mock' | 'websocket';
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

// Support for ?raw imports in Vite
declare module '*?raw' {
  const content: string;
  export default content;
}
