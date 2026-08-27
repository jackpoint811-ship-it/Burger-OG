/**
 * AdminAuthGate.tsx — Chekeo V3
 *
 * Candado de seguridad y autenticación por PIN exclusivo para el Panel de Control de Admin.
 * Permite que las áreas operativas (Cocina, Pedidos, Pagos) operen libremente sin contraseñas,
 * restringiendo el acceso administrativo a usuarios autorizados.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Lock, Eye, EyeOff, Loader, AlertCircle, ShieldCheck, Delete, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../features/auth';
import { Button } from '@ui/button';
import { Input } from '@ui/input';

export function AdminAuthGate() {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { login, status, error: serverError, clearError } = useAuthStore();
  const isSubmitting = status === 'checking';

  // Sincronizar errores
  const displayedError = localError || serverError;

  // Manejar envío
  const handleLogin = useCallback(
    async (pinValue: string) => {
      const trimmed = pinValue.trim();
      if (!trimmed) {
        setLocalError('Por favor ingresa tu PIN de administrador.');
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
      // Auto-submit instantáneo si el PIN tiene exactamente 4 dígitos
      if (newPin.length === 4) {
        setTimeout(() => {
          handleLogin(newPin);
        }, 150);
      }
    }
  };

  // Auto-focus en input al montar
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="min-h-[520px] py-6 sm:py-10 flex flex-col items-center justify-center animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-surface-card rounded-3xl p-6 sm:p-8 shadow-panel border border-line flex flex-col items-center transition-all">
        {/* Badge de Seguridad */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 border border-accent/25 text-accent text-xs font-black uppercase tracking-wider mb-5">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Acceso Administrativo</span>
        </div>

        {/* Ícono Principal */}
        <div className="w-14 h-14 rounded-2xl bg-surface-raised border border-line flex items-center justify-center mb-3 text-accent shadow-xs">
          <Lock className="w-7 h-7" aria-hidden="true" />
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-text-primary text-center mb-1.5">
          Panel de Control Protegido
        </h2>
        <p className="text-xs sm:text-sm text-text-secondary text-center mb-6 max-w-xs leading-relaxed">
          Ingresa tu PIN de 4 dígitos para acceder a la gestión de Menú, Inventario, Torres, Banners, Sorteos y Corte de Caja.
        </p>

        {/* Mensaje de Error si aplica */}
        {displayedError && (
          <div
            role="alert"
            className="w-full mb-5 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 text-red-600 dark:text-red-400 text-xs sm:text-sm animate-in fade-in duration-200"
          >
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 mt-0.5" />
            <div className="flex-1 font-bold">{displayedError}</div>
          </div>
        )}

        {/* Formulario de PIN */}
        <form onSubmit={handleSubmit} className="w-full space-y-4">
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
                const clean = e.target.value.replace(/\D/g, '').slice(0, 8);
                setPin(clean);
                if (clean.length === 4) {
                  setTimeout(() => handleLogin(clean), 150);
                }
              }}
              disabled={isSubmitting}
              className="pl-11 pr-11 text-center text-2xl tracking-[0.3em] font-mono h-14 rounded-2xl border-line bg-surface-raised font-black text-text-primary focus-visible:ring-2 focus-visible:ring-accent"
              aria-label="PIN de acceso administrativo numérico"
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
            className="w-full h-12 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer shadow-cta"
          >
            {isSubmitting ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Verificando PIN...</span>
              </>
            ) : (
              <>
                <span>Desbloquear Panel Admin</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>

          {/* Teclado Táctil en Pantalla (Ideal para tablets de mostrador / POS) */}
          <div className="pt-2">
            <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeypadPress(num)}
                  disabled={isSubmitting}
                  className="h-12 sm:h-13 rounded-2xl bg-surface-raised hover:bg-surface border border-line text-lg font-black text-text-primary active:scale-[0.97] transition-all flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:pointer-events-none shadow-xs"
                >
                  {num}
                </button>
              ))}

              <button
                type="button"
                onClick={() => handleKeypadPress('clear')}
                disabled={isSubmitting || pin.length === 0}
                className="h-12 sm:h-13 rounded-2xl bg-surface-raised hover:bg-surface border border-line text-xs font-black uppercase tracking-wider text-text-secondary active:scale-[0.97] transition-all flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                aria-label="Limpiar PIN"
              >
                C
              </button>

              <button
                type="button"
                onClick={() => handleKeypadPress('0')}
                disabled={isSubmitting}
                className="h-12 sm:h-13 rounded-2xl bg-surface-raised hover:bg-surface border border-line text-lg font-black text-text-primary active:scale-[0.97] transition-all flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:pointer-events-none shadow-xs"
              >
                0
              </button>

              <button
                type="button"
                onClick={() => handleKeypadPress('backspace')}
                disabled={isSubmitting || pin.length === 0}
                className="h-12 sm:h-13 rounded-2xl bg-surface-raised hover:bg-surface border border-line text-text-secondary hover:text-text-primary active:scale-[0.97] transition-all flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                aria-label="Borrar dígito"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>
          </div>
        </form>

        {/* Footer info */}
        <div className="mt-5 pt-3 border-t border-line w-full text-center">
          <p className="text-[11px] text-text-muted">
            Burgers.exe V3 • Seguridad Operativa
          </p>
        </div>
      </div>
    </div>
  );
}
