import React from 'react';
import type { Preview } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '../apps/internal-chekeo-v3/src/styles/globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

const customViewports = {
  mobile: {
    name: 'Mobile (iPhone 14 / 390px)',
    styles: {
      width: '390px',
      height: '844px',
    },
  },
  tablet: {
    name: 'Tablet POS / Cocina (iPad / 768px)',
    styles: {
      width: '768px',
      height: '1024px',
    },
  },
  desktop: {
    name: 'Desktop POS / Mostrador (1280px)',
    styles: {
      width: '1280px',
      height: '800px',
    },
  },
};

const preview: Preview = {
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-surface p-4 sm:p-6 text-text-primary transition-colors">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    viewport: {
      viewports: customViewports,
      defaultViewport: 'tablet',
    },
    backgrounds: {
      default: 'light-crema',
      values: [
        {
          name: 'light-crema',
          value: '#F5F2EE',
        },
        {
          name: 'white',
          value: '#FFFFFF',
        },
        {
          name: 'dark-slate',
          value: '#121212',
        },
        {
          name: 'dark-card',
          value: '#1E1E1E',
        },
      ],
    },
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true,
          },
        ],
      },
    },
  },
};

export default preview;
