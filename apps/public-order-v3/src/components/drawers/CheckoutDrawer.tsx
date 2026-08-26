import React, { useEffect, useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  X,
  Building2,
  Calendar,
  Clock,
  User,
  Phone,
  FileText,
  DollarSign,
  CreditCard,
  MessageSquare,
  Copy,
  Check,
  Sparkles,
  AlertCircle,
  ArrowRight,
  ChevronLeft,
  ShoppingBag,
  ShieldCheck,
} from 'lucide-react';
import {
  useUIStore,
  useCartStore,
  useCheckoutStore,
  selectCartItems,
  selectCartTotal,
  selectCartCount,
  type CheckoutFormData,
  type PaymentMethod,
} from '../../stores';
import {
  useActiveTowers,
  useTowerSchedulesQuery,
  useTowerAvailability,
  getNextAvailableDeliveryDate,
  useSiteConfig,
  useActiveRaffleQuery,
  useCreateOrderMutation,
  cartAndFormToCreateOrderPayload,
} from '../../features';
import { formatCurrency } from '../../utils/format';
import type { CreateOrderV2Response } from '@config/contracts';

// ─── Zod Schema para Validación Inline con React Hook Form ──────────────────

const checkoutFormSchema = z
  .object({
    customerName: z
      .string()
      .trim()
      .min(2, 'Ingresa tu nombre completo (mínimo 2 caracteres)')
      .max(80, 'El nombre es demasiado largo'),
    customerPhone: z
      .string()
      .trim()
      .min(10, 'Ingresa tu número de 10 dígitos')
      .regex(/^\d{10}$/, 'El teléfono debe tener exactamente 10 dígitos (ej: 5512345678)'),
    locationKey: z.string().trim().min(1, 'Por favor selecciona una torre de entrega'),
    orderMode: z.enum(['pickup', 'delivery']),
    paymentMethod: z.enum(['cash', 'transfer', 'card', 'unknown']),
    customerNotes: z
      .string()
      .max(300, 'Las notas no pueden exceder 300 caracteres')
      .optional(),
    isScheduled: z.boolean(),
    scheduledDate: z.string().optional(),
    scheduledTime: z.string().optional(),
    referralCode: z.string().max(30).optional(),
    wantsWhatsappGroup: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.isScheduled && (!data.scheduledDate || data.scheduledDate.trim() === '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Selecciona una fecha programada para tu entrega',
        path: ['scheduledDate'],
      });
    }
  });


type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

export interface CheckoutDrawerProps {
  onOrderSuccess?: (
    response: CreateOrderV2Response,
    orderDetails: {
      customerName: string;
      customerPhone: string;
      locationName: string;
      deliveryLabel: string;
      isScheduled: boolean;
      scheduledDate?: string;
      paymentMethod: string;
      total: number;
      supportPhone?: string;
    }
  ) => void;
}

export function CheckoutDrawer({ onOrderSuccess }: CheckoutDrawerProps) {
  const activeDrawer = useUIStore((s) => s.activeDrawer);
  const closeDrawer = useUIStore((s) => s.closeDrawer);
  const openDrawer = useUIStore((s) => s.openDrawer);
  const pushToast = useUIStore((s) => s.pushToast);

  const items = useCartStore(selectCartItems);
  const totalAmount = useCartStore(selectCartTotal);
  const totalItemsCount = useCartStore(selectCartCount);

  const storedForm = useCheckoutStore((s) => s.form);
  const updateField = useCheckoutStore((s) => s.updateField);
  const patchForm = useCheckoutStore((s) => s.patchForm);
  const resetAfterOrder = useCheckoutStore((s) => s.resetAfterOrder);

  const { towers = [] } = useActiveTowers();
  const { data: allTowers = [] } = useTowerSchedulesQuery();
  const { siteConfig } = useSiteConfig();
  const { data: raffleCampaign } = useActiveRaffleQuery();

  const [step, setStep] = useState<1 | 2>(1);
  const [copiedClabe, setCopiedClabe] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const isOpen = activeDrawer === 'checkout';

  // React Hook Form initialization with Zod resolver
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    mode: 'onTouched',
    defaultValues: {
      customerName: storedForm.customerName || '',
      customerPhone: storedForm.customerPhone || '',
      locationKey: storedForm.locationKey || (towers[0]?.towerName ?? towers[0]?.towerKey ?? ''),
      orderMode: 'delivery',
      paymentMethod: storedForm.paymentMethod || 'cash',
      customerNotes: storedForm.customerNotes || '',
      isScheduled: storedForm.isScheduled || false,
      scheduledDate: storedForm.scheduledDate || '',
      scheduledTime: storedForm.scheduledTime || '',
      referralCode: storedForm.referralCode || '',
      wantsWhatsappGroup: storedForm.wantsWhatsappGroup ?? true,
    },
  });

  const currentLocationKey = watch('locationKey');
  const currentIsScheduled = watch('isScheduled');
  const currentScheduledDate = watch('scheduledDate');
  const currentPaymentMethod = watch('paymentMethod');
  const currentCustomerName = watch('customerName');
  const currentCustomerPhone = watch('customerPhone');

  // Find active tower details
  const selectedTower = useMemo(() => {
    return (
      allTowers.find(
        (t) =>
          t.towerKey.toLowerCase() === currentLocationKey.toLowerCase() ||
          t.towerName.toLowerCase() === currentLocationKey.toLowerCase()
      ) || towers[0]
    );
  }, [allTowers, towers, currentLocationKey]);

  // Tower availability calculation
  const { status: towerAvailability } = useTowerAvailability(
    selectedTower?.towerKey,
    currentIsScheduled ? currentScheduledDate : undefined
  );

  const isTowerOpenToday = towerAvailability?.isOpen && !currentIsScheduled;
  const deliveryTimeDisplay = selectedTower?.deliveryLabel || '1:30 PM';
  const minScheduledDate = useMemo(() => {
    return getNextAvailableDeliveryDate(selectedTower?.towerKey, allTowers);
  }, [selectedTower, allTowers]);

  const hasActiveRaffle = Boolean(raffleCampaign?.id);
  const isPhoneComplete = Boolean(
    currentCustomerPhone && currentCustomerPhone.replace(/\D/g, '').length === 10
  );

  // Auto-switch to scheduled if tower is closed today
  useEffect(() => {
    if (selectedTower && towerAvailability && !towerAvailability.isOpen && !currentIsScheduled) {
      setValue('isScheduled', true);
      if (!currentScheduledDate) {
        setValue('scheduledDate', minScheduledDate);
      }
    }
  }, [selectedTower, towerAvailability, currentIsScheduled, currentScheduledDate, minScheduledDate, setValue]);

  // Sync default location if none selected
  useEffect(() => {
    if (!currentLocationKey && towers.length > 0 && towers[0]) {
      setValue('locationKey', towers[0].towerName);
    }
  }, [currentLocationKey, towers, setValue]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDrawer();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeDrawer]);

  // Bank config values with safe fallbacks
  const bankInfo = {
    bankName: siteConfig?.bankPaymentConfig?.bankName || 'BBVA México',
    accountHolder: siteConfig?.bankPaymentConfig?.accountHolder || 'Burgers.exe Oficial',
    clabe: siteConfig?.bankPaymentConfig?.clabe || '012 180 0156 7890 1234',
  };

  const handleCopyClabe = () => {
    const rawClabe = bankInfo.clabe.replace(/\s+/g, '');
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(rawClabe);
      setCopiedClabe(true);
      pushToast('CLABE copiada al portapapeles', 'info', 2000);
      setTimeout(() => setCopiedClabe(false), 2500);
    }
  };

  // TanStack Query Create Order Mutation
  const createOrderMutation = useCreateOrderMutation();

  const handleNextToStep2 = async () => {
    const isLocationValid = await trigger('locationKey');
    if (!isLocationValid) return;

    if (currentIsScheduled) {
      const isDateValid = await trigger('scheduledDate');
      if (!isDateValid) return;
    }

    setServerError(null);
    setStep(2);
  };

  const onSubmit = async (values: CheckoutFormValues) => {
    if (items.length === 0) {
      pushToast('El carrito está vacío. Agrega productos antes de continuar.', 'error');
      return;
    }

    // Persist customer details in Zustand / localStorage
    patchForm({
      customerName: values.customerName,
      customerPhone: values.customerPhone,
      locationKey: values.locationKey,
      paymentMethod: values.paymentMethod as PaymentMethod,
      customerNotes: values.customerNotes,
      isScheduled: values.isScheduled,
      scheduledDate: values.scheduledDate,
      referralCode: values.referralCode,
      wantsWhatsappGroup: values.wantsWhatsappGroup,
    });

    setServerError(null);

    try {
      const payload = cartAndFormToCreateOrderPayload(items, {
        customerName: values.customerName,
        customerPhone: values.customerPhone,
        locationKey: values.locationKey,
        orderMode: values.orderMode,
        paymentMethod: values.paymentMethod as PaymentMethod,
        customerNotes: values.customerNotes || '',
        isScheduled: values.isScheduled,
        scheduledDate: values.scheduledDate || '',
        scheduledTime: values.scheduledTime || '',
        referralCode: values.referralCode || '',
        wantsWhatsappGroup: values.wantsWhatsappGroup,
      });

      const response = await createOrderMutation.mutateAsync({ payload });

      if (response?.ok && response?.data?.order) {
        // Guardar snapshot para 1-Click Reorder
        try {
          localStorage.setItem('pov3-last-order', JSON.stringify(items));
        } catch {
          // Ignored
        }

        closeDrawer();
        resetAfterOrder();
        pushToast('¡Pedido creado exitosamente!', 'success', 4000);

        onOrderSuccess?.(response, {
          customerName: values.customerName,
          customerPhone: values.customerPhone,
          locationName: selectedTower?.towerName || values.locationKey,
          deliveryLabel: deliveryTimeDisplay,
          isScheduled: values.isScheduled,
          scheduledDate: values.scheduledDate,
          paymentMethod: values.paymentMethod,
          total: totalAmount,
          supportPhone: siteConfig?.supportPhone,
        });
      }
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'Error inesperado al registrar el pedido.';
      setServerError(errorMsg);
      pushToast(errorMsg, 'error', 5000);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        {/* Backdrop */}
        <motion.div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeDrawer}
          aria-hidden="true"
        />

        {/* Drawer Panel */}
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="drawer-checkout-title"
          className="relative z-50 w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-surface-card border-t sm:border border-line shadow-floating max-h-[92vh] flex flex-col overflow-hidden"
          initial={shouldReduceMotion ? { opacity: 0 } : { y: '100%' }}
          animate={shouldReduceMotion ? { opacity: 1 } : { y: 0 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-line shrink-0">
            <div className="flex items-center gap-3">
              {step === 2 && (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="rounded-full p-2 text-text-secondary hover:bg-surface hover:text-text-primary transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2"
                  aria-label="Volver al paso 1"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              <div className="w-10 h-10 rounded-2xl bg-accent/10 text-accent flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2
                  id="drawer-checkout-title"
                  className="text-lg font-bold text-text-primary tracking-tight"
                >
                  Finalizar Pedido
                </h2>
                <p className="text-xs text-text-secondary">
                  {step === 1
                    ? 'Paso 1: Ubicación, fecha y forma de pago'
                    : 'Paso 2: Datos de contacto y notas'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={closeDrawer}
              className="rounded-full p-2 text-text-secondary hover:bg-surface hover:text-text-primary transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Cerrar checkout"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stepper Progress Bar */}
          <div className="flex items-center px-5 py-2.5 bg-surface border-b border-line text-xs font-semibold">
            <button
              type="button"
              onClick={() => setStep(1)}
              className={`flex items-center gap-1.5 cursor-pointer ${
                step === 1 ? 'text-accent font-bold' : 'text-text-secondary'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                  step === 1
                    ? 'bg-accent text-white font-black'
                    : 'bg-accent/20 text-accent font-bold'
                }`}
              >
                1
              </span>
              <span>Entrega y Pago</span>
            </button>

            <div className="flex-1 mx-3 h-0.5 bg-line rounded-full overflow-hidden">
              <div
                className={`h-full bg-accent transition-all duration-300 ${
                  step === 2 ? 'w-full' : 'w-1/2'
                }`}
              />
            </div>

            <button
              type="button"
              onClick={handleNextToStep2}
              className={`flex items-center gap-1.5 cursor-pointer ${
                step === 2 ? 'text-accent font-bold' : 'text-text-secondary'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                  step === 2
                    ? 'bg-accent text-white font-black'
                    : 'bg-surface text-text-muted font-bold'
                }`}
              >
                2
              </span>
              <span>Tus Datos</span>
            </button>
          </div>

          {/* Form Container */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5"
          >
            {/* Server Error Alert Banner */}
            {serverError && (
              <div
                role="alert"
                className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <strong className="font-bold">No se pudo procesar tu pedido</strong>
                  <p>{serverError}</p>
                </div>
              </div>
            )}

            {/* ════════════════════ PASO 1: UBICACIÓN, FECHA Y PAGO ════════════════════ */}
            {step === 1 && (
              <div className="space-y-5">
                {/* 1. Selector de Torre Corporativa */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-text-primary uppercase tracking-wider">
                    Punto de Entrega (Torre Corporativa) *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {towers.map((tower) => {
                      const isSelected =
                        currentLocationKey.toLowerCase() === tower.towerName.toLowerCase() ||
                        currentLocationKey.toLowerCase() === tower.towerKey.toLowerCase();

                      return (
                        <button
                          key={tower.towerKey}
                          type="button"
                          onClick={() => {
                            setValue('locationKey', tower.towerName, { shouldValidate: true });
                          }}
                          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer min-h-[48px] flex items-center justify-between ${
                            isSelected
                              ? 'bg-accent/10 border-accent text-text-primary shadow-xs ring-1 ring-accent'
                              : 'bg-surface border-line hover:border-text-secondary/40 text-text-secondary'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-xl" aria-hidden="true">
                              {tower.emoji || '🏢'}
                            </span>
                            <div>
                              <p className="text-sm font-bold text-text-primary">{tower.towerName}</p>
                              <p className="text-[11px] text-text-muted">
                                Entrega diaria {tower.deliveryLabel || '1:30 PM'}
                              </p>
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-accent shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                  {errors.locationKey && (
                    <p className="text-xs text-red-500 font-medium">
                      {errors.locationKey.message}
                    </p>
                  )}
                </div>

                {/* 2. Horario y Modalidad de Entrega */}
                <div className="p-4 rounded-2xl bg-surface border border-line space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-accent" />
                      Horario de Entrega
                    </span>
                    <span className="text-xs font-black text-accent">
                      {deliveryTimeDisplay} (Puntual)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={!isTowerOpenToday}
                      onClick={() => {
                        setValue('isScheduled', false, { shouldValidate: true });
                        setValue('scheduledDate', '');
                      }}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all min-h-[44px] flex items-center justify-center gap-1.5 ${
                        !currentIsScheduled
                          ? 'bg-accent text-white border-accent shadow-xs'
                          : isTowerOpenToday
                          ? 'bg-surface-card border-line text-text-secondary hover:border-accent/40'
                          : 'bg-surface-card/40 border-line text-text-muted opacity-60 cursor-not-allowed'
                      }`}
                    >
                      <span>⚡ Hoy ({deliveryTimeDisplay})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setValue('isScheduled', true, { shouldValidate: true });
                        if (!currentScheduledDate) {
                          setValue('scheduledDate', minScheduledDate, { shouldValidate: true });
                        }
                      }}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all min-h-[44px] flex items-center justify-center gap-1.5 ${
                        currentIsScheduled
                          ? 'bg-accent text-white border-accent shadow-xs'
                          : 'bg-surface-card border-line text-text-secondary hover:border-accent/40'
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>📅 Programar Fecha</span>
                    </button>
                  </div>

                  {/* Warning if tower is closed today */}
                  {!isTowerOpenToday && !currentIsScheduled && (
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-2">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>
                        {towerAvailability?.message ||
                          'La ruta de pedidos de hoy ha concluido. Programa tu fecha para recibirlo en la próxima entrega.'}
                      </span>
                    </div>
                  )}

                  {/* Scheduled Date Picker */}
                  {currentIsScheduled && (
                    <div className="pt-2 border-t border-line space-y-1.5">
                      <label className="block text-xs font-bold text-text-secondary">
                        Selecciona el día de entrega:
                      </label>
                      <input
                        type="date"
                        min={minScheduledDate}
                        {...register('scheduledDate')}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-surface-card border border-line text-text-primary text-sm font-medium focus:outline-none focus:border-accent min-h-[44px]"
                      />
                      {errors.scheduledDate && (
                        <p className="text-xs text-red-500 font-medium">
                          {errors.scheduledDate.message}
                        </p>
                      )}
                      <p className="text-[11px] text-text-muted">
                        💡 Tu pedido se entregará en {selectedTower?.towerName} a las {deliveryTimeDisplay}.
                      </p>
                    </div>
                  )}
                </div>

                {/* 3. Método de Pago */}
                <div className="space-y-2.5">
                  <label className="block text-xs font-bold text-text-primary uppercase tracking-wider">
                    Método de Pago *
                  </label>
                  <div className="grid grid-cols-3 gap-2" role="radiogroup">
                    <button
                      type="button"
                      role="radio"
                      aria-checked={currentPaymentMethod === 'cash'}
                      onClick={() => setValue('paymentMethod', 'cash', { shouldValidate: true })}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer min-h-[48px] flex flex-col items-center justify-center gap-1 ${
                        currentPaymentMethod === 'cash'
                          ? 'bg-accent/10 border-accent text-accent font-extrabold ring-1 ring-accent'
                          : 'bg-surface border-line text-text-secondary hover:border-text-secondary/40'
                      }`}
                    >
                      <span className="text-lg">💵</span>
                      <span className="text-xs font-bold">Efectivo</span>
                    </button>

                    <button
                      type="button"
                      role="radio"
                      aria-checked={currentPaymentMethod === 'transfer'}
                      onClick={() => setValue('paymentMethod', 'transfer', { shouldValidate: true })}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer min-h-[48px] flex flex-col items-center justify-center gap-1 ${
                        currentPaymentMethod === 'transfer'
                          ? 'bg-accent/10 border-accent text-accent font-extrabold ring-1 ring-accent'
                          : 'bg-surface border-line text-text-secondary hover:border-text-secondary/40'
                      }`}
                    >
                      <span className="text-lg">📱</span>
                      <span className="text-xs font-bold">Transferencia</span>
                    </button>

                    <button
                      type="button"
                      role="radio"
                      aria-checked={currentPaymentMethod === 'unknown'}
                      onClick={() => setValue('paymentMethod', 'unknown', { shouldValidate: true })}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer min-h-[48px] flex flex-col items-center justify-center gap-1 ${
                        currentPaymentMethod === 'unknown'
                          ? 'bg-accent/10 border-accent text-accent font-extrabold ring-1 ring-accent'
                          : 'bg-surface border-line text-text-secondary hover:border-text-secondary/40'
                      }`}
                    >
                      <span className="text-lg">💬</span>
                      <span className="text-xs font-bold">Vía WhatsApp</span>
                    </button>
                  </div>

                  {/* Dynamic Bank Information Card */}
                  {currentPaymentMethod === 'transfer' && (
                    <motion.div
                      initial={shouldReduceMotion ? {} : { opacity: 0, y: 8 }}
                      animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
                      className="p-4 rounded-2xl bg-surface border border-accent/30 space-y-3 shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-accent flex items-center gap-1.5">
                          <CreditCard className="w-4 h-4" />
                          Datos Bancarios (Transferencia)
                        </span>
                        <span className="text-[11px] font-semibold text-text-muted">
                          {bankInfo.bankName}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-surface-card border border-line flex items-center justify-between gap-2">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-text-muted">
                            CLABE Interbancaria
                          </p>
                          <p className="text-sm font-black text-text-primary tracking-wider font-mono">
                            {bankInfo.clabe}
                          </p>
                          <p className="text-[11px] text-text-secondary">
                            Beneficiario: <strong>{bankInfo.accountHolder}</strong>
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={handleCopyClabe}
                          className="flex items-center gap-1 px-3 py-2 rounded-xl bg-surface border border-line text-xs font-bold text-text-primary hover:border-accent transition-colors cursor-pointer min-h-[44px]"
                          aria-label="Copiar CLABE interbancaria"
                        >
                          {copiedClabe ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-accent" />
                              <span className="text-accent">¡Copiada!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copiar</span>
                            </>
                          )}
                        </button>
                      </div>

                      <p className="text-[11px] text-text-muted">
                        💡 Realiza tu transferencia por el total ({formatCurrency(totalAmount)}) y ten listo tu comprobante para enviarlo al confirmar.
                      </p>
                    </motion.div>
                  )}
                </div>
              </div>
            )}

            {/* ════════════════════ PASO 2: DATOS DEL CLIENTE Y NOTAS ════════════════════ */}
            {step === 2 && (
              <div className="space-y-4">
                {/* Resumen del paso 1 */}
                <div className="p-3.5 rounded-2xl bg-surface border border-line flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <p className="font-bold text-text-primary">
                      📍 {selectedTower?.towerName} ·{' '}
                      {currentIsScheduled ? `📅 ${currentScheduledDate}` : '⚡ Hoy'} ({deliveryTimeDisplay})
                    </p>
                    <p className="text-text-muted">
                      Pago:{' '}
                      {currentPaymentMethod === 'cash'
                        ? '💵 Efectivo'
                        : currentPaymentMethod === 'transfer'
                        ? '📱 Transferencia'
                        : '💬 Vía WhatsApp'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs font-bold text-accent hover:underline cursor-pointer min-h-[44px] flex items-center"
                  >
                    Modificar
                  </button>
                </div>

                {/* Campo Nombre */}
                <div className="space-y-1">
                  <label htmlFor="checkout-customer-name" className="block text-xs font-bold text-text-primary uppercase tracking-wider">
                    Nombre Completo *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      id="checkout-customer-name"
                      type="text"
                      placeholder="Ej. Juan Pérez"
                      aria-invalid={Boolean(errors.customerName)}
                      aria-describedby={errors.customerName ? "checkout-name-error" : undefined}
                      {...register('customerName')}
                      className={`w-full pl-10 pr-3.5 py-3 rounded-2xl bg-surface border text-text-primary text-sm font-medium focus:outline-none min-h-[48px] ${
                        errors.customerName
                          ? 'border-red-500 focus:border-red-500'
                          : 'border-line focus:border-accent'
                      }`}
                    />
                  </div>
                  {errors.customerName && (
                    <p id="checkout-name-error" role="alert" className="text-xs text-red-500 font-medium pt-0.5">
                      {errors.customerName.message}
                    </p>
                  )}
                </div>

                {/* Campo Teléfono WhatsApp */}
                <div className="space-y-1">
                  <label htmlFor="checkout-customer-phone" className="block text-xs font-bold text-text-primary uppercase tracking-wider">
                    Teléfono WhatsApp (10 dígitos) *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      id="checkout-customer-phone"
                      type="tel"
                      inputMode="numeric"
                      placeholder="Ej. 5512345678"
                      aria-invalid={Boolean(errors.customerPhone)}
                      aria-describedby={errors.customerPhone ? "checkout-phone-error" : undefined}
                      {...register('customerPhone', {
                        onChange: (e) => {
                          const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setValue('customerPhone', digits, { shouldValidate: true });
                        },
                      })}
                      className={`w-full pl-10 pr-3.5 py-3 rounded-2xl bg-surface border text-text-primary text-sm font-medium focus:outline-none min-h-[48px] ${
                        errors.customerPhone
                          ? 'border-red-500 focus:border-red-500'
                          : 'border-line focus:border-accent'
                      }`}
                    />
                  </div>
                  {errors.customerPhone ? (
                    <p id="checkout-phone-error" role="alert" className="text-xs text-red-500 font-medium pt-0.5">
                      {errors.customerPhone.message}
                    </p>
                  ) : (
                    <p className="text-[11px] text-text-muted">
                      Te avisaremos por WhatsApp cuando tu pedido esté en recepción de {selectedTower?.towerName}.
                    </p>
                  )}
                </div>

                {/* Campo Notas de Entrega */}
                <div className="space-y-1">
                  <label htmlFor="checkout-customer-notes" className="block text-xs font-bold text-text-primary uppercase tracking-wider">
                    Instrucciones de Entrega / Notas (Opcional)
                  </label>
                  <div className="relative">
                    <div className="absolute top-3.5 left-3.5 pointer-events-none text-text-muted">
                      <FileText className="w-4 h-4" />
                    </div>
                    <textarea
                      id="checkout-customer-notes"
                      rows={2}
                      placeholder="Ej. Piso 4, entregar en recepción o dejar con guardia"
                      {...register('customerNotes')}
                      className="w-full pl-10 pr-3.5 py-3 rounded-2xl bg-surface border border-line text-text-primary text-sm font-medium focus:outline-none focus:border-accent resize-none"
                    />
                  </div>
                </div>

                {/* Código de Referido / Sorteo (Solo si hay sorteo activo) */}
                {hasActiveRaffle && (
                  <div className="space-y-1">
                    <label htmlFor="checkout-referral-code" className="block text-xs font-bold text-text-primary uppercase tracking-wider flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span aria-hidden="true">🎁</span>
                        <span>Código de Referido / Sorteo (Opcional)</span>
                      </span>
                      <span className="text-accent flex items-center gap-1 font-semibold text-[11px]">
                        <Sparkles className="w-3 h-3" />
                        Boletos extra
                      </span>
                    </label>
                    <input
                      id="checkout-referral-code"
                      type="text"
                      placeholder="Ej. BURGER-AMIGO"
                      {...register('referralCode')}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-surface border border-line text-text-primary text-sm font-medium uppercase tracking-wider focus:outline-none focus:border-accent min-h-[44px]"
                    />
                  </div>
                )}

                {/* Opt-in WhatsApp Group (Se despliega tras escribir los 10 dígitos del teléfono) */}
                <AnimatePresence>
                  {isPhoneComplete && (
                    <motion.label
                      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, height: 0, y: -6 }}
                      animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, height: 'auto', y: 0 }}
                      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, height: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-start gap-2.5 p-3 rounded-2xl bg-surface border border-line cursor-pointer overflow-hidden"
                    >
                      <input
                        type="checkbox"
                        {...register('wantsWhatsappGroup')}
                        className="mt-1 rounded text-accent focus:ring-accent w-4 h-4 shrink-0"
                      />
                      <span className="text-xs text-text-secondary leading-relaxed">
                        📲 Quiero unirme a la comunidad y recibir avisos de promociones exclusivas en WhatsApp.
                      </span>
                    </motion.label>
                  )}
                </AnimatePresence>
              </div>
            )}
          </form>

          {/* Sticky Total & Bottom CTA Footer */}
          <div className="border-t border-line bg-surface-card p-4 sm:p-5 space-y-3 shadow-panel shrink-0">
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-text-secondary">
                <span>
                  🛒 {totalItemsCount} {totalItemsCount === 1 ? 'producto' : 'productos'}
                </span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
              <div className="flex items-center justify-between text-text-secondary">
                <span>Entrega a {selectedTower?.towerName || 'Torre'}</span>
                <span className="font-bold text-accent">¡Gratis en tu edificio!</span>
              </div>
              <div className="flex items-center justify-between text-base font-extrabold text-text-primary pt-1 border-t border-line">
                <span>Total a Pagar</span>
                <span className="text-xl text-accent font-black">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </div>

            {step === 1 ? (
              <button
                type="button"
                onClick={handleNextToStep2}
                disabled={items.length === 0}
                className="w-full py-3.5 px-4 rounded-2xl bg-accent text-white font-extrabold text-base hover:bg-accent-dark transition-colors shadow-cta cursor-pointer min-h-[48px] flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Siguiente: Datos de Contacto</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit(onSubmit)}
                disabled={isSubmitting || items.length === 0}
                className="w-full py-3.5 px-4 rounded-2xl bg-accent text-white font-extrabold text-base hover:bg-accent-dark transition-colors shadow-cta cursor-pointer min-h-[48px] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Registrando Pedido...</span>
                  </>
                ) : (
                  <>
                    <span>Confirmar y Enviar Pedido ({formatCurrency(totalAmount)})</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
