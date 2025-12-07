import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import viteCustomPluginImport from './vite-custom-plugin-import';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig(() => {
  return {
    build: {
      cssCodeSplit: false, // merge styles to a css file
      rollupOptions: {
        output: {
          format: 'iife', // 打包为 IIFE 格式，不需要 type="module"
          entryFileNames: 'js/[name]-[hash].js',
          chunkFileNames: 'js/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            if (assetInfo.names?.[0]?.endsWith('.css')) {
              return 'css/[name]-[hash][extname]';
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
