import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@codestrike/shared': path.resolve(__dirname, 'packages/shared/src'),
      '@codestrike/core': path.resolve(__dirname, 'packages/core/src'),
      '@codestrike/ai': path.resolve(__dirname, 'packages/ai/src'),
      '@codestrike/agents': path.resolve(__dirname, 'packages/agents/src'),
      '@codestrike/config': path.resolve(__dirname, 'packages/config/src'),
      '@codestrike/database': path.resolve(__dirname, 'packages/database/src'),
      '@codestrike/terminal': path.resolve(__dirname, 'packages/terminal/src'),
      '@codestrike/git': path.resolve(__dirname, 'packages/git/src'),
      '@codestrike/rag': path.resolve(__dirname, 'packages/rag/src'),
      '@codestrike/ui': path.resolve(__dirname, 'packages/ui/src'),
      '@codestrike/plugins': path.resolve(__dirname, 'packages/plugins/src'),
      '@codestrike/memory': path.resolve(__dirname, 'packages/memory/src'),
      '@codestrike/tools': path.resolve(__dirname, 'packages/tools/src'),
      '@codestrike/mcp': path.resolve(__dirname, 'packages/mcp/src'),
    },
  },
  test: {
    include: ['packages/*/src/**/*.test.ts', 'apps/*/src/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
  },
});
