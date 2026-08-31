import React, { useState } from 'react';
import { Store, Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';
import { Dialog } from '@ui/dialog';
import { Button } from '@ui/button';
import { Input } from '@ui/input';
import { Label } from '@ui/label';
import { Badge } from '@ui/badge';
import { SAAS_PLANS, type SaaSPlanTier } from '@config';
import type { FoodTypeKind } from '@config';

export interface TenantOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (tenantData: any) => void;
}

const TASTE_ACCENTS = [
  { name: 'Verde Bosque', hex: '#16A34A' },
  { name: 'Naranja Sazón', hex: '#EA580C' },
  { name: 'Azul Bistro', hex: '#2563EB' },
  { name: 'Rojo Carmesí', hex: '#DC2626' },
  { name: 'Carbón Slate', hex: '#1E293B' },
  { name: 'Dorado Gourmet', hex: '#D97706' },
];

const MENU_TEMPLATES = [
  { id: 'burgers', title: 'Hamburguesería & Combos', emoji: '🍔', desc: 'Recetas de carnes, smash, papas sazonadas y bebidas.' },
  { id: 'tortas_chilaquiles', title: 'Tortas, Chilaquiles & Desayunos', emoji: '🥪', desc: 'Desayunos mexicanos, tortas y jugos naturales.' },
  { id: 'tacos', title: 'Taquería & Antojitos', emoji: '🌮', desc: 'Tacos al pastor, gringas, salsas y complementos.' },
  { id: 'blank', title: 'Menú en Blanco', emoji: '📋', desc: 'Empieza desde cero con tu propio catálogo personalizado.' },
];

export function TenantOnboardingModal({ isOpen, onClose, onSuccess }: TenantOnboardingModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Estado del Formulario
  const [brandName, setBrandName] = useState('');
  const [shortName, setShortName] = useState('');
  const [slug, setSlug] = useState('');
  const [tagline, setTagline] = useState('');
  const [logoEmoji, setLogoEmoji] = useState('🍽️');
  const [accentColor, setAccentColor] = useState('#16A34A');
  const [menuTemplate, setMenuTemplate] = useState<'burgers' | 'tortas_chilaquiles' | 'tacos' | 'blank'>('burgers');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [pinCode, setPinCode] = useState('1234');
  const [planTier, setPlanTier] = useState<SaaSPlanTier>('starter');

  // Resultado de Éxito
  const [createdTenant, setCreatedTenant] = useState<any>(null);

  const handleBrandNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setBrandName(val);
    if (!shortName) setShortName(val.slice(0, 20));
    if (!slug) {
      setSlug(
        val
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .slice(0, 25)
      );
    }
  };

  const handleCreateTenant = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    const payload = {
      brandName,
      shortName: shortName || brandName.slice(0, 20),
      slug: slug.toLowerCase().trim(),
      tagline,
      logoEmoji,
      defaultFoodType: (menuTemplate === 'burgers' ? 'burger' : menuTemplate === 'tortas_chilaquiles' ? 'torta' : 'other') as FoodTypeKind,
      accentColor,
      radiusStyle: 'rounded' as const,
      ownerEmail,
      ownerPhone,
      pinCode,
      planTier,
      menuTemplate,
    };

    try {
      const res = await fetch('/api/saas/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = (await res.json()) as { ok?: boolean; message?: string; data?: any };

      if (json.ok) {
        setCreatedTenant(json.data);
        setStep(4);
        if (onSuccess) onSuccess(json.data);
      } else {
        setErrorMessage(json.message || 'Error al crear el restaurante.');
      }
    } catch {
      setErrorMessage('Error de conexión al procesar el alta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalTitle = (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
          <Store className="w-4 h-4" />
        </div>
        <span className="text-base font-black text-white">
          {step === 4 ? '🎉 ¡Restaurante Creado!' : 'Lanza tu Restaurante en Chekeo Cloud'}
        </span>
      </div>
      {step < 4 && (
        <Badge variant="outline" className="font-mono text-[10px] text-purple-400 border-purple-500/30 bg-purple-500/10 font-black">
          Paso {step} / 3
        </Badge>
      )}
    </div>
  );

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      title={modalTitle}
      description={
        step === 1
          ? 'Paso 1: Identidad, nombre y colores de marca'
          : step === 2
          ? 'Paso 2: Selección de menú y recetas base'
          : step === 3
          ? 'Paso 3: Datos del dueño y plan de suscripción'
          : 'Tu nueva tienda y comandería están listas para operar'
      }
      maxWidth="lg"
      className="p-5"
    >
      <div className="space-y-4 pt-1 max-h-[70vh] overflow-y-auto">
        {errorMessage && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-xs text-red-400 font-bold">
            ⚠️ {errorMessage}
          </div>
        )}

        {/* PASO 1: Identidad & Branding */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="brandName" className="text-xs font-bold text-slate-200">
                Nombre del Restaurante / Marca *
              </Label>
              <Input
                id="brandName"
                value={brandName}
                onChange={handleBrandNameChange}
                placeholder="Ej. Tacos El Güero, Pizzería Bella, etc."
                className="rounded-xl border-slate-700 bg-slate-900 text-slate-100 text-xs font-bold h-10"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="slug" className="text-xs font-bold text-slate-200">
                  Identificador / Slug URL *
                </Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().trim())}
                  placeholder="tacos-el-guero"
                  className="rounded-xl border-slate-700 bg-slate-900 text-slate-100 text-xs font-mono h-10"
                />
                <p className="text-[10px] text-slate-400 font-mono truncate">
                  https://{slug || 'mi-tienda'}.chekeo.io
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="logoEmoji" className="text-xs font-bold text-slate-200">
                  Emoji / Icono de Marca
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="logoEmoji"
                    value={logoEmoji}
                    onChange={(e) => setLogoEmoji(e.target.value)}
                    className="rounded-xl border-slate-700 bg-slate-900 text-slate-100 text-lg text-center h-10 w-16"
                  />
                  <div className="flex gap-1">
                    {['🍔', '🥪', '🌮', '🍕', '☕', '🍗'].map((em) => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => setLogoEmoji(em)}
                        className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm flex items-center justify-center cursor-pointer active:scale-95"
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-200">Color de Acento Principal</Label>
              <div className="flex items-center gap-2">
                {TASTE_ACCENTS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setAccentColor(c.hex)}
                    title={c.name}
                    style={{ backgroundColor: c.hex }}
                    className={`w-7 h-7 rounded-full border-2 transition-all cursor-pointer ${
                      accentColor === c.hex ? 'border-white scale-110 shadow-md' : 'border-transparent opacity-80'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PASO 2: Plantilla de Menú */}
        {step === 2 && (
          <div className="space-y-3">
            <Label className="text-xs font-bold text-slate-200">Selecciona una Plantilla de Menú Base</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {MENU_TEMPLATES.map((tpl) => (
                <div
                  key={tpl.id}
                  onClick={() => setMenuTemplate(tpl.id as any)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all space-y-1 ${
                    menuTemplate === tpl.id
                      ? 'bg-purple-500/10 border-purple-500 ring-2 ring-purple-500/30 shadow-xs'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{tpl.emoji}</span>
                    <p className="text-xs font-black text-white">{tpl.title}</p>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight">{tpl.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PASO 3: Contacto & Plan */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ownerEmail" className="text-xs font-bold text-slate-200">
                  Correo del Administrador *
                </Label>
                <Input
                  id="ownerEmail"
                  type="email"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  placeholder="dueño@tacos.com"
                  className="rounded-xl border-slate-700 bg-slate-900 text-slate-100 text-xs font-bold h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ownerPhone" className="text-xs font-bold text-slate-200">
                  WhatsApp de Contacto *
                </Label>
                <Input
                  id="ownerPhone"
                  type="tel"
                  value={ownerPhone}
                  onChange={(e) => setOwnerPhone(e.target.value)}
                  placeholder="5512345678"
                  className="rounded-xl border-slate-700 bg-slate-900 text-slate-100 text-xs font-bold h-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pinCode" className="text-xs font-bold text-slate-200">
                PIN de Acceso POS (4 dígitos)
              </Label>
              <Input
                id="pinCode"
                maxLength={4}
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
                placeholder="1234"
                className="rounded-xl border-slate-700 bg-slate-900 text-slate-100 text-base font-black tracking-widest text-center w-32 h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-200">Nivel de Servicio (Acceso Anticipado $0)</Label>
              <div className="grid grid-cols-3 gap-2">
                {(['starter', 'pro', 'enterprise'] as SaaSPlanTier[]).map((pKey) => {
                  const plan = SAAS_PLANS[pKey];
                  return (
                    <div
                      key={pKey}
                      onClick={() => setPlanTier(pKey)}
                      className={`p-2.5 rounded-2xl border text-center cursor-pointer transition-all ${
                        planTier === pKey
                          ? 'bg-purple-500/20 border-purple-500 text-purple-300 font-black shadow-xs'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400'
                      }`}
                    >
                      <p className="text-[11px] font-black">{plan.name.split('/')[0]}</p>
                      <p className="text-[10px] font-bold text-purple-400">Gratis en Beta</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* PASO 4: Pantalla de Éxito */}
        {step === 4 && createdTenant && (
          <div className="space-y-4 text-center py-2">
            <div className="w-16 h-16 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center mx-auto text-2xl">
              {logoEmoji}
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-white">
                ¡{createdTenant.brandName} está en vivo!
              </h3>
              <p className="text-xs text-slate-300">
                Hemos configurado tu tienda online y punto de venta con acceso anticipado gratuito.
              </p>
            </div>

            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 text-left space-y-2">
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400">Tienda Pública de Clientes:</p>
                <p className="text-xs font-mono font-bold text-purple-400 truncate">{createdTenant.storeUrl}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400">Acceso a Chekeo POS / KDS:</p>
                <p className="text-xs font-mono font-bold text-slate-200 truncate">{createdTenant.posUrl}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400">PIN de Operación:</p>
                <p className="text-xs font-mono font-black text-slate-100">{createdTenant.adminPin || '1234'}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer con Botones de Navegación */}
      <div className="pt-4 mt-3 border-t border-slate-800 flex items-center justify-between">
        {step > 1 && step < 4 ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setStep((step - 1) as any)}
            className="h-9 px-3 rounded-xl text-xs font-bold gap-1 cursor-pointer border-slate-700 bg-slate-800 text-slate-200"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Anterior</span>
          </Button>
        ) : <div />}

        {step < 3 && (
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => {
              if (step === 1 && !brandName) {
                setErrorMessage('Por favor ingresa el nombre de tu marca');
                return;
              }
              setErrorMessage(null);
              setStep((step + 1) as any);
            }}
            className="h-9 px-4 rounded-xl text-xs font-black gap-1 cursor-pointer bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
          >
            <span>Siguiente</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        )}

        {step === 3 && (
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleCreateTenant}
            disabled={isSubmitting || !ownerEmail || !ownerPhone}
            className="h-9 px-5 rounded-xl text-xs font-black gap-1.5 cursor-pointer bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-500 hover:to-indigo-500 shadow-md"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Creando Tienda...' : 'Lanzar Restaurante'}</span>
          </Button>
        )}

        {step === 4 && (
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={onClose}
            className="w-full h-10 rounded-xl text-xs font-black cursor-pointer bg-purple-600 hover:bg-purple-500 text-white"
          >
            Cerrar y Empezar a Operar
          </Button>
        )}
      </div>
    </Dialog>
  );
}
