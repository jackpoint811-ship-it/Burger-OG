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
  // Proxy /api para dev:internal → wrangler pages dev corriendo en :8788 (local).
  // Las functions de Cloudflare corren localmente y leen D1 preview remota con --remote,
  // o D1 local sin ese flag. dev:public NO usa este proxy.
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
    emptyOutDir: true
  }
});
