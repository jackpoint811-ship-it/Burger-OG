import React from 'react';

export function PublicApp() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
      <div className="max-w-md w-full bg-surface-card rounded-2xl p-6 shadow-panel border border-line">
        <span className="inline-block text-3xl mb-3">🍔</span>
        <h1 className="text-xl font-bold text-text-primary mb-2">
          Burgers.exe V3 — Public Order
        </h1>
        <p className="text-sm text-text-secondary mb-4">
          Arquitectura modular limpia basada en React 19, TanStack Query y Tailwind CSS v4.
        </p>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
          Scaffold V3 Activo
        </div>
      </div>
    </div>
  );
}
