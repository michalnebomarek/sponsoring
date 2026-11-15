/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare module 'virtual:course' {
  import type { Course } from '../build/content.ts';
  const course: Course;
  export default course;
}

interface Document {
  startViewTransition?: (cb: () => void | Promise<void>) => unknown;
}

declare const __BUILD_DATE__: string;
