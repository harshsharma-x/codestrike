import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: 'cjs',
  clean: true,
  platform: 'node',
  target: 'node18',
  noExternal: ['@codestrike/core', '@codestrike/ai', '@codestrike/agents', '@codestrike/rag', '@codestrike/git', '@codestrike/terminal', '@codestrike/shared', '@codestrike/memory', '@codestrike/plugins', '@codestrike/tools'],
});
