import React from 'react';
import { SaaSHubView } from '../components/SaaSHubView';

export function SaaSApp() {
  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 antialiased selection:bg-purple-500 selection:text-white">
      <SaaSHubView />
    </div>
  );
}
