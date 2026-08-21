/**
 * WhatsAppAction.tsx — PR-V3-11
 *
 * WhatsApp Bridge interactivo para comunicación directa con el cliente:
 * - Selección de plantillas preformateadas (Confirmación de pago, En camino, Resumen, SPEI).
 * - Campo para nota personalizada opcional con re-renderizado instantáneo.
 * - Copiado de mensaje al portapapeles con feedback visual.
 * - Enlace directo hacia WhatsApp Web / App (`wa.me/521...`).
 */

import React, { useState, useMemo } from 'react';
import {
  MessageCircle,
  Copy,
  CheckCircle2,
  ExternalLink,
  Truck,
  Receipt,
  Clock,
  Edit3,
  X,
  Send,
  Phone,
} from 'lucide-react';
import { Dialog } from '@ui/dialog';
import { Button } from '@ui/button';
import { Badge } from '@ui/badge';
import { Textarea } from '@ui/textarea';
import type { OrderV2 } from '@config/index';
import {
  WHATSAPP_TEMPLATES,
  buildWhatsAppUrl,
  normalizeWhatsAppPhone,
  type WhatsAppTemplateKey,
} from '../../features/payments';

export interface WhatsAppActionModalProps {
  order: OrderV2 | null;
  isOpen: boolean;
  onClose: () => void;
  defaultTemplateKey?: WhatsAppTemplateKey;
}

export function WhatsAppActionModal({
  order,
  isOpen,
  onClose,
  defaultTemplateKey = 'confirmation',
}: WhatsAppActionModalProps) {
  const [selectedTemplateKey, setSelectedTemplateKey] =
    useState<WhatsAppTemplateKey>(defaultTemplateKey);
  const [customNote, setCustomNote] = useState('');
  const [copied, setCopied] = useState(false);

  // Reiniciar estado al abrir o cambiar orden
  React.useEffect(() => {
    if (isOpen && order) {
      // Si el pago es pending y es SPEI, sugerir recordatorio SPEI; si está pagado, confirmación
      if (order.paymentStatus === 'paid') {
        setSelectedTemplateKey('confirmation');
      } else if (order.paymentMethod === 'transfer') {
        setSelectedTemplateKey('spei_reminder');
      } else {
        setSelectedTemplateKey('ticket_summary');
      }
      setCustomNote('');
      setCopied(false);
    }
  }, [isOpen, order]);

  // Obtener plantilla activa
  const activeTemplate = useMemo(() => {
    return (
      WHATSAPP_TEMPLATES.find((t) => t.key === selectedTemplateKey) ||
      WHATSAPP_TEMPLATES[0]
    );
  }, [selectedTemplateKey]);

  // Generar mensaje final
  const messageText = useMemo(() => {
    if (!order) return '';
    return activeTemplate.generate(order, customNote);
  }, [order, activeTemplate, customNote]);

  // Enlace directo a WhatsApp
  const whatsappUrl = useMemo(() => {
    if (!order) return '#';
    return buildWhatsAppUrl(order.customerPhone, messageText);
  }, [order, messageText]);

  const handleCopy = () => {
    if (!messageText) return;
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  if (!order) return null;

  const normalizedPhone = normalizeWhatsAppPhone(order.customerPhone);

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="lg"
      className="p-0 overflow-hidden max-h-[92vh] flex flex-col bg-surface-card"
    >
      {/* ─── Header del Modal ──────────────────────────────────────────────── */}
      <div className="p-4 sm:p-6 border-b border-line bg-surface-raised flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 shadow-xs">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-text-primary">
                WhatsApp Bridge
              </h3>
              <Badge variant="success" className="text-[10px] font-extrabold">
                #{order.folio}
              </Badge>
            </div>
            <p className="text-xs text-text-secondary font-medium">
              Contacto con <strong className="text-text-primary">{order.customerName}</strong> ({normalizedPhone || order.customerPhone})
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface transition-colors"
          title="Cerrar modal"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* ─── Cuerpo del Modal con Scroll ───────────────────────────────────── */}
      <div className="p-4 sm:p-6 space-y-5 overflow-y-auto max-h-[calc(92vh-140px)]">
        {/* Selector de Plantillas */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-text-muted block">
            Seleccionar Plantilla de Mensaje
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {WHATSAPP_TEMPLATES.map((tpl) => {
              const isSelected = tpl.key === selectedTemplateKey;
              return (
                <button
                  key={tpl.key}
                  type="button"
                  onClick={() => setSelectedTemplateKey(tpl.key)}
                  className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'border-line bg-surface hover:bg-surface-raised text-text-secondary'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-bold text-text-primary">
                      {tpl.shortLabel}
                    </span>
                    {tpl.iconName === 'check-circle' && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                    {tpl.iconName === 'truck' && (
                      <Truck className="w-3.5 h-3.5 text-blue-600" />
                    )}
                    {tpl.iconName === 'receipt' && (
                      <Receipt className="w-3.5 h-3.5 text-purple-600" />
                    )}
                    {tpl.iconName === 'clock' && (
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                    )}
                    {tpl.iconName === 'edit-3' && (
                      <Edit3 className="w-3.5 h-3.5 text-text-muted" />
                    )}
                  </div>
                  <p className="text-[11px] text-text-muted line-clamp-1">
                    {tpl.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Nota / Mensaje adicional */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-text-secondary block">
            {selectedTemplateKey === 'custom'
              ? 'Mensaje personalizado:'
              : 'Nota adicional o indicaciones especiales (opcional):'}
          </label>
          <Textarea
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            placeholder={
              selectedTemplateKey === 'custom'
                ? 'Escribe el mensaje personalizado para el cliente…'
                : 'Ej: Llegamos en 5 minutos al lobby, o por favor tener cambio de $500…'
            }
            className="text-xs h-20 bg-surface resize-none"
          />
        </div>

        {/* Vista Previa del Mensaje */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Vista Previa (Formato WhatsApp)
            </span>
            <span className="text-[11px] text-text-muted">
              {messageText.length} caracteres
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-surface border border-line font-sans text-xs text-text-primary whitespace-pre-wrap leading-relaxed shadow-inner max-h-56 overflow-y-auto">
            {messageText}
          </div>
        </div>
      </div>

      {/* ─── Footer de Acciones ────────────────────────────────────────────── */}
      <div className="p-4 sm:p-5 border-t border-line bg-surface-raised flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-1.5 text-xs text-text-muted font-medium w-full sm:w-auto">
          <Phone className="w-3.5 h-3.5" />
          <span>Destino: {normalizedPhone || 'Sin número válido'}</span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={handleCopy}
            className="flex-1 sm:flex-none text-xs font-bold"
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600 animate-in zoom-in-75" />
                <span className="text-emerald-600 font-extrabold">¡Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-1.5" />
                <span>Copiar Mensaje</span>
              </>
            )}
          </Button>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-none"
          >
            <Button
              type="button"
              variant="default"
              size="md"
              className="w-full text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center justify-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              <span>Abrir WhatsApp</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </Button>
          </a>
        </div>
      </div>
    </Dialog>
  );
}
