import { Component, type ErrorInfo, type ReactNode } from 'react';

type InternalV2ErrorBoundaryProps = {
  children: ReactNode;
};

type InternalV2ErrorBoundaryState = {
  hasError: boolean;
};

export class InternalV2ErrorBoundary extends Component<
  InternalV2ErrorBoundaryProps,
  InternalV2ErrorBoundaryState
> {
  state: InternalV2ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): InternalV2ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _errorInfo: ErrorInfo) {
    // Intentionally avoid logging runtime details here: session details must never
    // be exposed through user-visible errors or console output in preview.
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className='shell'>
        <section className='card mx-auto mt-10 max-w-xl p-6 text-center border border-[var(--color-line)] bg-[var(--color-surface)] shadow-[var(--shadow-panel)] rounded-2xl'>
          <p className='text-xs font-black uppercase tracking-[0.2em] text-rose-600 dark:text-rose-400'>
            Chekeo · Error
          </p>
          <h1 className='mt-2 text-2xl font-black text-[var(--color-text-primary)]'>Algo falló en Chekeo</h1>
          <p className='mt-2 text-sm text-[var(--color-text-secondary)]'>
            Recarga la consola para volver a un estado seguro. No se muestran
            detalles técnicos en pantalla.
          </p>
          <button
            type='button'
            className='mt-4 rounded-xl bg-[var(--color-accent)] hover:opacity-90 px-4 py-2.5 text-sm font-bold text-white transition-opacity'
            onClick={() => window.location.reload()}
          >
            Recargar
          </button>
        </section>
      </main>
    );
  }
}
