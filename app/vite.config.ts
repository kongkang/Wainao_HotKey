import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

const rootDir = resolve(__dirname, 'renderer');
const workspaceRoot = resolve(__dirname, '..');

export default defineConfig({
  root: rootDir,
  plugins: [vue()],
  resolve: {
    alias: {
      '@renderer': resolve(rootDir, 'src'),
      '@stores': resolve(rootDir, 'src/stores'),
      '@components': resolve(rootDir, 'src/components'),
      '@views': resolve(rootDir, 'src/views'),
      '@core': resolve(workspaceRoot, 'core')
    }
  },
  server: {
    port: 4173,
    open: true,
    fs: {
      allow: [workspaceRoot]
    }
  },
  preview: {
    port: 4174
  },
  build: {
    outDir: resolve(__dirname, 'dist/renderer'),
    emptyOutDir: true
  }
});
