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
  // Proxy /api para desarrollo local hacia el backend de preview en Cloudflare Pages
  ...(isInternal
    ? {
        server: {
          proxy: {
            '/api': {
              target: process.env.API_PROXY_TARGET || 'https://burgers-exe-internal-v2-preview.pages.dev',
              changeOrigin: true,
              secure: true,
            },
          },
        },
      }
    : {}),
  build: {
    outDir: path.resolve(__dirname, `dist/${target}`),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (
              id.includes('/react/') ||
              id.includes('/react-dom/') ||
              id.includes('/scheduler/')
            ) {
              return 'vendor-react';
            }
            if (
              id.includes('@tanstack/react-query') ||
              id.includes('@tanstack/query-core')
            ) {
              return 'vendor-query';
            }
            if (id.includes('framer-motion')) {
              return 'vendor-framer';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (
              id.includes('@radix-ui') ||
              id.includes('tailwind-merge') ||
              id.includes('clsx')
            ) {
              return 'vendor-ui';
            }
            if (
              id.includes('/zod/') ||
              id.includes('/react-hook-form/') ||
              id.includes('@hookform')
            ) {
              return 'vendor-forms';
            }
          }
        },
      },
    },
  },
});
