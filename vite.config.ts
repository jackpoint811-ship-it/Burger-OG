import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const target = process.env.APP_TARGET === 'internal' ? 'internal-chekeo-v2' : 'public-order-v2';

const isInternal = process.env.APP_TARGET === 'internal';

export default defineConfig({
  root: path.resolve(__dirname, `apps/${target}`),
  plugins: [react()],
  resolve: {
    alias: {
      '@ui': path.resolve(__dirname, 'packages/ui/src'),
      '@config': path.resolve(__dirname, 'packages/config/src')
    }
  },
  // Proxy /api solo para dev:internal — redirige al Chekeo preview para que
  // las Functions de Cloudflare Pages respondan sin necesidad de wrangler local.
  // dev:public NO usa este proxy; sus llamadas se resuelven contra el public preview.
  ...(isInternal
    ? {
        server: {
          proxy: {
            '/api': {
              target: 'https://burgers-exe-internal-v2-preview.pages.dev',
              changeOrigin: true,
              secure: true,
            },
          },
        },
      }
    : {}),
  build: {
    outDir: path.resolve(__dirname, `dist/${target}`),
    emptyOutDir: true
  }
});
