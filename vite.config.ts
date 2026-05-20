import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'HDKey',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'mjs' : 'cjs'}`,
    },
    minify: false,
    sourcemap: true,
    rollupOptions: {
      external: [/@noble\/.*/, /@scure\/.*/, 'node:buffer', 'node:crypto'],
      output: {
        exports: 'named',
      },
    },
  },
  plugins: [dts({ tsconfigPath: './tsconfig.json' })],
});
