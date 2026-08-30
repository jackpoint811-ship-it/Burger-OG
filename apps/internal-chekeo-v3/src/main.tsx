import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TenantThemeProvider } from '@ui';
import { ChekeoApp } from './app/ChekeoApp';
import './styles/globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30s
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <TenantThemeProvider>
        <QueryClientProvider client={queryClient}>
          <ChekeoApp />
        </QueryClientProvider>
      </TenantThemeProvider>
    </React.StrictMode>
  );
}
