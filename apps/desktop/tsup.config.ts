import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/main.ts', 'src/preload.ts'],
  format: ['cjs'],
  outDir: 'dist',
  clean: true,
  external: ['electron'],
  target: 'es2022',
  platform: 'node',
});
