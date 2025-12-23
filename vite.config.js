import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import viteCustomPluginImport from './vite-custom-plugin-import';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig(() => {
  return {
    base: './',
    build: {
      rollupOptions: {
        output: {
          entryFileNames: '[name]-[hash].js',
          chunkFileNames: '[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            if (assetInfo.names?.[0]?.endsWith('.css')) {
              return '[name]-[hash][extname]';
            }
            return 'assets/[name]-[hash][extname]';
          },
        },
      },
      assetsInlineLimit: 4 * 1024, // default is 4KB
    },
    plugins: [
      react({}),
      viteCustomPluginImport({
        libraryName: 'dtable-ui-component',
        libraryDirectory: 'lib',
        camel2DashComponentName: false,
        camel2UnderlineComponentName: false,
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@constants': path.resolve(__dirname, './src/constants'),
        '@utils': path.resolve(__dirname, './src/utils'),
      },
    },
  };
});
