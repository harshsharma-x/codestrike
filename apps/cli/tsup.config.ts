import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: 'cjs',
  clean: true,
  noExternal: ['chalk', 'commander', 'ora', 'inquirer', 'conf', 'zod'],
  external: ['@codestrike/core', '@codestrike/ai', '@codestrike/agents', '@codestrike/rag', '@codestrike/git', '@codestrike/terminal', '@codestrike/shared', '@codestrike/memory', '@codestrike/plugins', '@codestrike/tools'],
});
