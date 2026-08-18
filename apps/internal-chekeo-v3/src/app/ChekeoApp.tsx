import React from 'react';

export function ChekeoApp() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
      <div className="max-w-md w-full bg-surface-card rounded-2xl p-6 shadow-panel border border-line">
        <span className="inline-block text-3xl mb-3">👨‍🍳</span>
        <h1 className="text-xl font-bold text-text-primary mb-2">
          Chekeo V3 — Operaciones & Cocina
        </h1>
        <p className="text-sm text-text-secondary mb-4">
          Panel operativo interno modular (Pedidos, Cocina, Pagos y Administración).
        </p>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
          Scaffold Chekeo V3 Activo
        </div>
      </div>
    </div>
  );
}
