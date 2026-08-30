import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const targetMap: Record<string, string> = {
  'public': 'public-order-v3',
  'chekeo': 'internal-chekeo-v3',
  'internal': 'internal-chekeo-v3',
  'public-v3': 'public-order-v3',
  'chekeo-v3': 'internal-chekeo-v3',
};

const rawTarget = process.env.APP_TARGET ?? 'public';
const target = targetMap[rawTarget] ?? rawTarget;

const isInternal = target.includes('internal') || target.includes('chekeo');

export default defineConfig({
  root: path.resolve(__dirname, `apps/${target}`),
  plugins: [
    react(),
    tailwindcss(),
  ],
  define: {
    'process.env.APP_TENANT': JSON.stringify(process.env.APP_TENANT || ''),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, `apps/${target}/src`),
      '@ui': path.resolve(__dirname, 'packages/ui/src'),
      '@config': path.resolve(__dirname, 'packages/config/src'),
    },
  },
  // Proxy /api para dev:internal / dev:chekeo -> wrangler pages dev corriendo en :8788
  ...(isInternal
    ? {
        server: {
          proxy: {
            '/api': {
              target: 'http://localhost:8788',
              changeOrigin: false,
              secure: false,
            },
          },
        },
      }
    : {}),
  build: {
    outDir: path.resolve(__dirname, `dist/${target}`),
    emptyOutDir: true,
  },
});
