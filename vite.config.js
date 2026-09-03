import { copyFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [{
    name: 'copy-static-cart-fallback',
    apply: 'build',
    async closeBundle() {
      const outputDirectory = resolve(import.meta.dirname, 'dist/js');
      await mkdir(outputDirectory, { recursive: true });
      await copyFile(
        resolve(import.meta.dirname, 'js/static-cart.js'),
        resolve(outputDirectory, 'static-cart.js'),
      );
    },
  }],
  build: {
    rollupOptions: {
      input: {
        admin: resolve(import.meta.dirname, 'admin/index.html'),
        main: resolve(import.meta.dirname, 'index.html'),
      },
    },
    sourcemap: false,
  },
});
