import type { StorybookConfig } from '@storybook/react-vite';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const dirname = path.dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
  stories: [
    '../packages/ui/src/**/*.stories.@(ts|tsx)',
    '../apps/**/*.stories.@(ts|tsx)',
  ],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  viteFinal: async (viteConfig) => {
    const tailwindcss = (await import('@tailwindcss/vite')).default;

    viteConfig.plugins = viteConfig.plugins || [];
    viteConfig.plugins.push(tailwindcss());

    viteConfig.resolve = viteConfig.resolve || {};
    viteConfig.resolve.alias = {
      ...viteConfig.resolve.alias,
      '@ui': path.resolve(dirname, '../packages/ui/src'),
      '@config': path.resolve(dirname, '../packages/config/src'),
      '@': path.resolve(dirname, '../apps/internal-chekeo-v3/src'),
    };

    return viteConfig;
  },
};

export default config;
