/**
 * AuthGate.tsx — PR-V3-08
 *
 * Pantalla de autenticación y gate de seguridad por PIN para Chekeo V3.
 * Incluye teclado numérico táctil optimizado para pantallas POS/cocina y soporte de teclado físico.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Lock, Eye, EyeOff, Loader, AlertCircle, ShieldCheck, Delete, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../stores/auth.store';
import { Button } from '@ui/button';
import { Input } from '@ui/input';

export function AuthGate() {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { login, status, error: serverError, clearError } = useAuthStore();
  const isSubmitting = status === 'checking';

  // Sincronizar errores
  const displayedError = localError || serverError;

  // Detección de entorno
  const isProduction =
    typeof window !== 'undefined' &&
    window.location.hostname.includes('burgers') &&
    !window.location.hostname.includes('preview') &&
    !window.location.hostname.includes('localhost') &&
    !window.location.hostname.includes('127.0.0.1');

  const envLabel = isProduction ? 'Producción' : window.location.hostname.includes('preview') ? 'Preview' : 'Desarrollo';

  // Manejar envío
  const handleLogin = useCallback(
    async (pinValue: string) => {
      const trimmed = pinValue.trim();
      if (!trimmed) {
        setLocalError('Por favor ingresa tu PIN de acceso.');
        return;
      }

      setLocalError(null);
      clearError();

      const success = await login(trimmed);
      if (!success) {
        setPin('');
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }
    },
    [login, clearError]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin(pin);
  };

  // Manejar toques del teclado táctil
  const handleKeypadPress = (val: string) => {
    if (isSubmitting) return;
    setLocalError(null);
    clearError();

    if (val === 'clear') {
      setPin('');
      return;
    }

    if (val === 'backspace') {
      setPin((prev) => prev.slice(0, -1));
      return;
    }

    if (val === 'enter') {
      handleLogin(pin);
      return;
    }

    if (pin.length < 8) {
      const newPin = pin + val;
      setPin(newPin);
      // Auto-submit opcional si el PIN tiene exactamente 4 dígitos tras un breve delay táctil
      if (newPin.length === 4) {
        setTimeout(() => {
          handleLogin(newPin);
        }, 150);
      }
    }
  };

  // Auto-focus en input al cargar
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4 sm:p-6 transition-colors duration-200">
      {/* Contenedor Principal */}
      <div className="w-full max-w-md bg-surface-card rounded-3xl p-6 sm:p-8 shadow-panel border border-line flex flex-col items-center">
        {/* Header con Marca y Badge de Entorno */}
        <div className="w-full flex items-center justify-between mb-6 pb-4 border-b border-line">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tight text-text-primary">
              Burgers<span className="text-accent">.exe</span>
            </span>
            <span className="px-2 py-0.5 rounded-md bg-accent/15 text-accent text-[11px] font-extrabold uppercase tracking-wider">
              CHEKEO V3
            </span>
          </div>

          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
              isProduction
                ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isProduction ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-pulse'
              }`}
            />
            {envLabel}
          </div>
        </div>

        {/* Ícono y Título */}
        <div className="w-14 h-14 rounded-2xl bg-accent-soft flex items-center justify-center mb-4 text-accent">
          <ShieldCheck className="w-7 h-7" aria-hidden="true" />
        </div>

        <h1 className="text-2xl font-bold text-text-primary text-center mb-1">
          Acceso Operativo
        </h1>
        <p className="text-sm text-text-secondary text-center mb-6 max-w-xs">
          Ingresa tu PIN de 4 dígitos para acceder a Pedidos, Cocina, Pagos y Administración.
        </p>

        {/* Mensaje de Error si aplica */}
        {displayedError && (
          <div
            role="alert"
            className="w-full mb-5 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 text-red-600 dark:text-red-400 text-sm animate-in fade-in duration-200"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{displayedError}</div>
          </div>
        )}

        {/* Formulario de PIN */}
        <form onSubmit={handleSubmit} className="w-full space-y-5">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted">
              <Lock className="w-5 h-5" />
            </div>

            <Input
              ref={inputRef}
              type={showPin ? 'text' : 'password'}
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="current-password"
              placeholder="••••"
              value={pin}
              onChange={(e) => {
                setLocalError(null);
                clearError();
                setPin(e.target.value.replace(/\D/g, '').slice(0, 8));
              }}
              disabled={isSubmitting}
              className="pl-11 pr-11 text-center text-2xl tracking-[0.3em] font-mono h-14 rounded-2xl border-line bg-surface-raised font-bold text-text-primary focus:border-accent"
              aria-label="PIN de acceso numérico"
            />

            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-text-muted hover:text-text-primary transition-colors cursor-pointer"
              aria-label={showPin ? 'Ocultar PIN' : 'Mostrar PIN'}
              tabIndex={-1}
            >
              {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {/* Botón de Submit Principal */}
          <Button
            type="submit"
            disabled={isSubmitting || pin.length === 0}
            className="w-full h-12 rounded-2xl font-bold text-base flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Verificando PIN...</span>
              </>
            ) : (
              <>
                <span>Entrar a Chekeo</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </Button>

          {/* Teclado Táctil en Pantalla (Ideal para tablets de cocina y POS) */}
          <div className="pt-2">
            <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeypadPress(num)}
                  disabled={isSubmitting}
                  className="h-12 sm:h-13 rounded-xl bg-surface-raised hover:bg-surface border border-line text-lg font-bold text-text-primary active:scale-[0.97] transition-all flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                >
                  {num}
                </button>
              ))}

              <button
                type="button"
                onClick={() => handleKeypadPress('clear')}
                disabled={isSubmitting || pin.length === 0}
                className="h-12 sm:h-13 rounded-xl bg-surface-raised hover:bg-surface border border-line text-xs font-bold uppercase tracking-wider text-text-secondary active:scale-[0.97] transition-all flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                aria-label="Limpiar PIN"
              >
                C
              </button>

              <button
                type="button"
                onClick={() => handleKeypadPress('0')}
                disabled={isSubmitting}
                className="h-12 sm:h-13 rounded-xl bg-surface-raised hover:bg-surface border border-line text-lg font-bold text-text-primary active:scale-[0.97] transition-all flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              >
                0
              </button>

              <button
                type="button"
                onClick={() => handleKeypadPress('backspace')}
                disabled={isSubmitting || pin.length === 0}
                className="h-12 sm:h-13 rounded-xl bg-surface-raised hover:bg-surface border border-line text-text-secondary hover:text-text-primary active:scale-[0.97] transition-all flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                aria-label="Borrar dígito"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>
          </div>
        </form>

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-line w-full text-center">
          <p className="text-xs text-text-muted">
            Burgers.exe V3 • Sistema Operativo Interno
          </p>
        </div>
      </div>
    </div>
  );
}
