import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TenantThemeProvider } from '@ui';
import { PublicApp } from './app/PublicApp';
import './styles/globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
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
          <PublicApp />
        </QueryClientProvider>
      </TenantThemeProvider>
    </React.StrictMode>
  );
}
