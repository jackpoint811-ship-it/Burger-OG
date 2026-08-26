/**
 * BankDetailsModal.tsx — Chekeo V3 Pagos Refinement
 *
 * Modal de consulta rápida y copiado de datos bancarios oficiales (BBVA / CLABE)
 * para transferencias SPEI:
 * - Visualización clara de Banco, Titular, CLABE y Número de Cuenta.
 * - Botón de 1-toque para copiar la CLABE al portapapeles con feedback visual.
 * - Botón para copiar toda la ficha bancaria en texto plano.
 */

import React, { useState } from 'react';
import { Building2, Copy, CheckCircle2, X, CreditCard, ShieldCheck } from 'lucide-react';
import { Dialog } from '@ui/dialog';
import { Button } from '@ui/button';
import { Badge } from '@ui/badge';
import { DEFAULT_BANK_DETAILS, type BankAccountDetails } from '../../features/payments';

export interface BankDetailsModalProps {
  open: boolean;
  onClose: () => void;
  bankDetails?: BankAccountDetails;
}

export function BankDetailsModal({
  open,
  onClose,
  bankDetails = DEFAULT_BANK_DETAILS,
}: BankDetailsModalProps) {
  const [copiedClabe, setCopiedClabe] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

  const handleCopyClabe = () => {
    navigator.clipboard.writeText(bankDetails.clabe);
    setCopiedClabe(true);
    setTimeout(() => setCopiedClabe(false), 2000);
  };

  const handleCopyAll = () => {
    const text = [
      '🏦 DATOS BANCARIOS — BURGERS.EXE',
      `• Banco: ${bankDetails.bankName}`,
      `• Titular: ${bankDetails.accountHolder}`,
      `• CLABE Interbancaria: ${bankDetails.clabe}`,
      bankDetails.accountNumber ? `• Número de Cuenta: ${bankDetails.accountNumber}` : null,
      bankDetails.referencePrefix ? `• Concepto/Referencia: ${bankDetails.referencePrefix} + Folio` : null,
    ]
      .filter(Boolean)
      .join('\n');

    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      className="p-0 overflow-hidden bg-surface-card border border-line shadow-floating rounded-3xl"
    >
      {/* Cabecera */}
      <div className="p-4 sm:p-5 border-b border-line bg-surface-raised flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 shadow-xs">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-text-primary">
                Cuenta para Transferencias
              </h3>
              <Badge variant="default" className="text-[10px] font-extrabold bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20">
                Oficial
              </Badge>
            </div>
            <p className="text-xs text-text-secondary font-medium">
              Datos para transferencias y dictado al cliente
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface transition-colors cursor-pointer"
          title="Cerrar modal"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Contenido / Ficha */}
      <div className="p-5 sm:p-6 space-y-4">
        {/* Tarjeta de CLABE Destacada */}
        <div className="p-4 rounded-2xl bg-surface-raised border border-line space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-text-muted">
              CLABE Interbancaria (18 dígitos)
            </span>
            <span className="flex items-center gap-1 text-[11px] font-bold text-accent">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verificada</span>
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 bg-surface p-3 rounded-xl border border-line">
            <code className="text-sm sm:text-base font-mono font-black text-text-primary tracking-wider select-all">
              {bankDetails.clabe}
            </code>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyClabe}
              className="h-8 px-2.5 rounded-lg text-xs font-bold shrink-0 cursor-pointer"
              title="Copiar CLABE"
            >
              {copiedClabe ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-accent" />
                  <span className="text-accent font-extrabold">¡Copiada!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1" />
                  <span>Copiar</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Desglose de Campos */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-surface-raised border border-line space-y-0.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-text-muted">
              Banco
            </span>
            <p className="font-bold text-text-primary text-sm">
              {bankDetails.bankName}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-surface-raised border border-line space-y-0.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-text-muted">
              Beneficiario / Titular
            </span>
            <p className="font-bold text-text-primary text-sm truncate" title={bankDetails.accountHolder}>
              {bankDetails.accountHolder}
            </p>
          </div>

          {bankDetails.accountNumber && (
            <div className="p-3 rounded-xl bg-surface-raised border border-line space-y-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-text-muted">
                No. de Cuenta
              </span>
              <p className="font-mono font-bold text-text-primary">
                {bankDetails.accountNumber}
              </p>
            </div>
          )}

          {bankDetails.referencePrefix && (
            <div className="p-3 rounded-xl bg-surface-raised border border-line space-y-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-text-muted">
                Concepto / Ref.
              </span>
              <p className="font-bold text-text-primary">
                {bankDetails.referencePrefix} + #Folio
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 sm:p-5 border-t border-line bg-surface-raised flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCopyAll}
          className="text-xs font-bold cursor-pointer"
        >
          {copiedAll ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-accent" />
              <span className="text-accent font-extrabold">¡Ficha Copiada!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 mr-1.5" />
              <span>Copiar Ficha Completa</span>
            </>
          )}
        </Button>

        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={onClose}
          className="text-xs font-bold cursor-pointer"
        >
          Cerrar
        </Button>
      </div>
    </Dialog>
  );
}
