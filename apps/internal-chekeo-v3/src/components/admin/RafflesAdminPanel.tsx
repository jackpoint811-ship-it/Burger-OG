/**
 * RafflesAdminPanel.tsx — Chekeo V3
 *
 * Submódulo de Lealtad, Campaña de Sorteos, Boletos y Sistema de Referidos.
 * Integrado con Dynamic UI Components (@ui/kpi-card, @ui/segmented-control, @ui/drawer, @ui/badge),
 * Ruleta de sorteo interactiva ponderada con Framer Motion, generador de códigos de invitado y auditoría de tickets.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gift,
  Trophy,
  Users,
  Ticket,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  Link as LinkIcon,
  ShoppingBag,
  Dice5,
  RefreshCw,
  Edit2,
  Trash2,
  Crown,
  Dices,
  Flame,
  Check,
} from 'lucide-react';
import type { RaffleParticipantSummary, RaffleCampaignV2 } from '@config/index';
import { Button } from '@ui/button';
import { Badge } from '@ui/badge';
import { KpiCard } from '@ui/kpi-card';
import { SegmentedControl } from '@ui/segmented-control';
import { Drawer } from '@ui/drawer';
import { useAdminRaffles } from '../../features/admin/hooks/use-admin';
import type {
  CreateTicketAdjustmentAdminPayload,
  CreateReferralCodeAdminPayload,
} from '../../features/admin/types/admin.types';

const BURGER_WORDS = [
  'BURGER',
  'SMASH',
  'BACON',
  'PICKLES',
  'CHEESE',
  'FRIES',
  'PAPAS',
  'TOCINO',
  'QUESO',
  'CRUNCH',
  'BBQ',
  'COMBO',
  'OG',
];

export interface RafflesAdminPanelProps {
  activeToolId?: string;
  onSelectTool?: (toolId: string) => void;
}

export function RafflesAdminPanel({ activeToolId, onSelectTool }: RafflesAdminPanelProps = {}) {
  const [activeTab, setActiveTab] = useState<string>('participants');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

  // Sincronizar activeToolId con pestaña interna
  useEffect(() => {
    if (activeToolId === 'codes') {
      setActiveTab('codes');
    } else if (activeToolId === 'referrals') {
      setActiveTab('referrals');
    } else if (activeToolId === 'participants') {
      setActiveTab('participants');
    }
  }, [activeToolId]);

  const {
    campaigns,
    activeCampaign,
    summary,
    referralCodes,
    referrals,
    isLoading,
    refetchSummary,
    createAdjustmentMutation,
    createReferralCodeMutation,
    updateReferralCodeMutation,
    updateReferralMutation,
  } = useAdminRaffles(selectedCampaignId, searchQuery);

  // Drawers state
  const [isAdjustmentDrawerOpen, setIsAdjustmentDrawerOpen] = useState(false);
  const [isCodeDrawerOpen, setIsCodeDrawerOpen] = useState(false);
  const [isWinnerDrawerOpen, setIsWinnerDrawerOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<RaffleParticipantSummary | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Adjustment Form
  const [adjustmentDelta, setAdjustmentDelta] = useState('1');
  const [adjustmentReason, setAdjustmentReason] = useState('');

  // Referral Code Form
  const [codeOwnerName, setCodeOwnerName] = useState('');
  const [codeOwnerPhone, setCodeOwnerPhone] = useState('');
  const [codeBurgerWord, setCodeBurgerWord] = useState('BURGER');
  const [codeNumber, setCodeNumber] = useState('27');

  // Winner Roulette state
  const [winnerResult, setWinnerResult] = useState<RaffleParticipantSummary | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinningName, setSpinningName] = useState('Mezclando...');

  // Participantes filtrados
  const participants = useMemo(() => {
    if (!summary?.participantResults) return summary?.topParticipants || [];
    return summary.participantResults;
  }, [summary]);

  const handleOpenAdjustment = (participant: RaffleParticipantSummary) => {
    setSelectedParticipant(participant);
    setAdjustmentDelta('1');
    setAdjustmentReason('');
    setIsAdjustmentDrawerOpen(true);
  };

  const handleGenerateRandomCode = () => {
    const randomWord = BURGER_WORDS[Math.floor(Math.random() * BURGER_WORDS.length)];
    const randomNum = Math.floor(Math.random() * 90) + 10;
    setCodeBurgerWord(randomWord);
    setCodeNumber(String(randomNum));
  };

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParticipant || !activeCampaign) return;

    const delta = Number(adjustmentDelta);
    if (!Number.isInteger(delta) || delta === 0) return;
    if (!adjustmentReason.trim()) return;

    const payload: CreateTicketAdjustmentAdminPayload = {
      campaignId: activeCampaign.id,
      participantKey: selectedParticipant.participantKey,
      ticketsDelta: delta,
      reason: adjustmentReason.trim(),
      actor: 'chekeo-v3-admin',
    };

    try {
      await createAdjustmentMutation.mutateAsync(payload);
      setIsAdjustmentDrawerOpen(false);
      setNotice(`Ajuste de ${delta > 0 ? `+${delta}` : delta} tickets guardado correctamente.`);
      setTimeout(() => setNotice(null), 3000);
    } catch {
      // Handled
    }
  };

  const handleSaveReferralCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCampaign) return;

    const payload: CreateReferralCodeAdminPayload = {
      campaignId: activeCampaign.id,
      ownerName: codeOwnerName.trim(),
      ownerPhone: codeOwnerPhone.trim(),
      burgerWord: codeBurgerWord,
      number: Number(codeNumber) || 27,
    };

    try {
      await createReferralCodeMutation.mutateAsync(payload);
      setIsCodeDrawerOpen(false);
      setNotice('Código de invitado creado con éxito.');
      setTimeout(() => setNotice(null), 3000);
    } catch {
      // Handled
    }
  };

  const handleToggleCodeActive = async (id: string, currentActive: boolean) => {
    try {
      await updateReferralCodeMutation.mutateAsync({ id, payload: { isActive: !currentActive } });
      setNotice(`Código ${!currentActive ? 'activado ✓' : 'pausado ⏸️'}`);
      setTimeout(() => setNotice(null), 2500);
    } catch {
      // Handled
    }
  };

  const handleUpdateReferralStatus = async (id: string, status: 'valid' | 'invalid') => {
    try {
      await updateReferralMutation.mutateAsync({
        id,
        payload: {
          status,
          invalidReason: status === 'invalid' ? 'Invalidado manualmente en panel admin' : undefined,
        },
      });
      setNotice(`Pedido referido marcado como ${status === 'valid' ? 'Válido ✓' : 'Inválido ✕'}`);
      setTimeout(() => setNotice(null), 2500);
    } catch {
      // Handled
    }
  };

  // Sorteo Animado Ponderado
  const handleStartDraw = () => {
    if (!participants || participants.length === 0) return;
    setIsWinnerDrawerOpen(true);
    setIsSpinning(true);
    setWinnerResult(null);

    // Construir bolsa ponderada de boletos
    const pool: RaffleParticipantSummary[] = [];
    participants.forEach((p) => {
      const tickets = Math.max(1, p.totalTickets || 1);
      for (let i = 0; i < tickets; i++) {
        pool.push(p);
      }
    });

    // Simulación de giro con nombres cambiando a alta velocidad
    let spinCount = 0;
    const interval = setInterval(() => {
      const randomP = pool[Math.floor(Math.random() * pool.length)];
      setSpinningName(randomP?.customerName || 'Seleccionando...');
      spinCount++;
      if (spinCount > 25) {
        clearInterval(interval);
        const randomIndex = Math.floor(Math.random() * pool.length);
        setWinnerResult(pool[randomIndex] || participants[0] || null);
        setIsSpinning(false);
      }
    }, 100);
  };

  // Pestañas de SegmentedControl
  const tabItems = [
    { id: 'participants', label: '👥 Participantes', count: participants.length },
    { id: 'codes', label: '🔗 Códigos de Invitado', count: referralCodes.length },
    { id: 'referrals', label: '🛍️ Pedidos Referidos', count: referrals.length },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Toast Flotante */}
      <AnimatePresence>
        {notice && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3.5 rounded-2xl bg-accent-soft border border-accent/20 text-accent text-xs font-black flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-accent" />
              <span>{notice}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="opacity-70 hover:opacity-100 cursor-pointer text-base leading-none"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Tarjetas KPI Reactivas (@ui/kpi-card) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          title="Boletos Totales"
          value={summary?.totalTickets ?? 0}
          subtitle={`🍔 ${summary?.baseTickets ?? 0} base · 🎁 ${summary?.extraTickets ?? 0} extra`}
          icon={<Ticket className="w-4 h-4" />}
          variant="accent"
        />
        <KpiCard
          title="Participantes"
          value={summary?.totalParticipants ?? 0}
          subtitle="Con al menos 1 boleto"
          icon={<Users className="w-4 h-4" />}
          variant="default"
        />
        <KpiCard
          title="Códigos de Invitado"
          value={referralCodes.length}
          subtitle={`${referralCodes.filter((c) => c.isActive).length} activos`}
          icon={<LinkIcon className="w-4 h-4" />}
          variant="info"
        />
        <KpiCard
          title="Top Líder"
          value={summary?.topParticipants?.[0]?.customerName || '—'}
          subtitle={summary?.topParticipants?.[0] ? `${summary.topParticipants[0].totalTickets} boletos acumulados` : 'Sin participantes'}
          icon={<Trophy className="w-4 h-4" />}
          variant="warning"
        />
      </div>

      {/* 2. Banner de Campaña Activa & Botón de Sorteo */}
      <div className="bg-surface-card p-5 rounded-3xl border border-line shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shrink-0">
            <Gift className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge variant="default" className="text-[10px] font-bold bg-accent text-white">
                {activeCampaign ? (activeCampaign.isActive ? 'Campaña en Vivo' : 'Pausada') : 'Sin Campaña'}
              </Badge>
              {activeCampaign && (
                <span className="text-[11px] text-text-secondary font-mono">
                  {activeCampaign.ticketPerBurger} ticket/burger · {activeCampaign.ticketPerReferral} tickets/referido
                </span>
              )}
            </div>
            <h3 className="text-base font-black text-text-primary">
              {activeCampaign?.title || 'Sorteo Burgers.exe'}
            </h3>
            <p className="text-xs text-text-secondary">
              {activeCampaign?.description || 'Gana premios acumulando boletos con cada hamburguesa o referido.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            type="button"
            onClick={handleStartDraw}
            disabled={!participants || participants.length === 0}
            className="text-xs font-black bg-amber-500 hover:bg-amber-600 text-white shadow-xs h-9 px-4 rounded-xl cursor-pointer active:scale-95"
          >
            <Dice5 className="w-4 h-4 mr-1.5" />
            Sortear Ganador
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => refetchSummary()}
            className="p-2 h-9 w-9 text-text-secondary hover:text-text-primary rounded-xl cursor-pointer"
            title="Refrescar sorteos"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* 3. Sub-Tabs con SegmentedControl */}
      <div className="bg-surface-card p-3.5 sm:p-4 rounded-3xl border border-line shadow-xs">
        <SegmentedControl
          items={tabItems}
          value={activeTab}
          onChange={setActiveTab}
          layoutId="raffles-tabs-segmented"
          size="sm"
          className="w-full sm:w-auto"
        />
      </div>

      {/* TAB 1: Participantes & Boletos */}
      {activeTab === 'participants' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 sm:max-w-md">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Buscar participante por nombre o teléfono..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-surface-card border border-line text-text-primary outline-none focus:border-accent font-medium"
              />
            </div>
            <span className="text-xs text-text-secondary font-medium self-end sm:self-auto">
              Mostrando {participants.length} participantes
            </span>
          </div>

          <div className="bg-surface-card rounded-3xl border border-line overflow-hidden shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-line bg-surface-raised text-[11px] font-bold text-text-secondary">
                    <th className="py-3 px-4"># Ranking</th>
                    <th className="py-3 px-4">Participante</th>
                    <th className="py-3 px-4">Teléfono</th>
                    <th className="py-3 px-4 text-center">Burgers</th>
                    <th className="py-3 px-4 text-center">Referidos</th>
                    <th className="py-3 px-4 text-center">Ajustes</th>
                    <th className="py-3 px-4 text-center font-extrabold text-accent">Total Boletos</th>
                    <th className="py-3 px-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {participants.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-text-muted">
                        No hay participantes registrados todavía.
                      </td>
                    </tr>
                  ) : (
                    participants.map((p, idx) => (
                      <tr key={p.participantKey} className="hover:bg-surface-raised/40 transition-colors">
                        <td className="py-3 px-4 font-bold text-text-secondary">
                          {idx === 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 text-xs font-black">
                              <Crown className="w-3 h-3" /> 1° Lugar
                            </span>
                          ) : idx === 1 ? (
                            <span className="px-2 py-0.5 rounded-lg bg-slate-500/15 text-slate-600 dark:text-slate-400 text-xs font-black">
                              2° Lugar
                            </span>
                          ) : idx === 2 ? (
                            <span className="px-2 py-0.5 rounded-lg bg-amber-700/15 text-amber-800 dark:text-amber-300 text-xs font-black">
                              3° Lugar
                            </span>
                          ) : (
                            <span className="font-mono">{idx + 1}°</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-bold text-text-primary">
                          {p.customerName}
                          {p.lastOrderFolio && (
                            <span className="block text-[10px] font-mono text-text-muted font-normal">
                              Último pedido: #{p.lastOrderFolio}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-text-secondary">
                          {p.customerPhoneMasked || '—'}
                        </td>
                        <td className="py-3 px-4 text-center font-semibold text-text-primary font-mono">
                          {p.burgerTickets}
                        </td>
                        <td className="py-3 px-4 text-center font-semibold text-text-primary font-mono">
                          {p.referralTickets}
                        </td>
                        <td className="py-3 px-4 text-center font-semibold text-text-secondary font-mono">
                          {p.manualExtraTickets > 0 ? `+${p.manualExtraTickets}` : p.manualExtraTickets}
                        </td>
                        <td className="py-3 px-4 text-center font-black text-accent text-sm font-mono tabular-nums">
                          {p.totalTickets} tickets
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => handleOpenAdjustment(p)}
                            className="text-xs h-7 px-2.5 rounded-lg font-black cursor-pointer active:scale-95"
                          >
                            + Ajuste
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Códigos de Invitado */}
      {activeTab === 'codes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-sm font-black text-text-primary">Códigos Registrados para Compartir</h4>
            <Button
              type="button"
              onClick={() => {
                setCodeOwnerName('');
                setCodeOwnerPhone('');
                handleGenerateRandomCode();
                setIsCodeDrawerOpen(true);
              }}
              className="text-xs font-black bg-accent text-white h-8.5 px-3 rounded-xl cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Nuevo Código
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {referralCodes.map((code) => (
              <div
                key={code.id}
                className="bg-surface-card rounded-3xl border border-line p-5 shadow-card space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-black font-mono text-accent bg-accent-soft px-3 py-1 rounded-xl">
                      {code.code}
                    </span>
                    <Badge variant={code.isActive ? 'default' : 'outline'} className="text-[10px] font-bold">
                      {code.isActive ? 'Activo' : 'Pausado'}
                    </Badge>
                  </div>

                  <div>
                    <h5 className="text-xs font-black text-text-primary">{code.ownerName}</h5>
                    <p className="text-[11px] text-text-secondary font-mono">{code.ownerPhoneMasked}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-line flex items-center justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleToggleCodeActive(code.id, code.isActive)}
                    className="text-xs h-7 px-2.5 rounded-lg font-bold cursor-pointer active:scale-95"
                  >
                    {code.isActive ? 'Pausar' : 'Reactivar'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Pedidos Referidos */}
      {activeTab === 'referrals' && (
        <div className="bg-surface-card rounded-3xl border border-line overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-line bg-surface-raised text-[11px] font-bold text-text-secondary">
                  <th className="py-3 px-4">Folio Orden</th>
                  <th className="py-3 px-4">Código Utilizado</th>
                  <th className="py-3 px-4">Referente (Anfitrión)</th>
                  <th className="py-3 px-4">Cliente Referido</th>
                  <th className="py-3 px-4 text-center">Boletos</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {referrals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-text-muted">
                      No hay pedidos con referido registrados.
                    </td>
                  </tr>
                ) : (
                  referrals.map((r) => (
                    <tr key={r.id} className="hover:bg-surface-raised/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-text-primary">
                        #{r.referredOrderFolio}
                      </td>
                      <td className="py-3 px-4 font-mono font-black text-accent">
                        {r.code}
                      </td>
                      <td className="py-3 px-4 text-text-primary font-medium">
                        {r.referrerName}
                      </td>
                      <td className="py-3 px-4 text-text-primary font-medium">
                        {r.referredCustomerName}
                      </td>
                      <td className="py-3 px-4 text-center font-black text-accent font-mono">
                        +{r.ticketsAwarded}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge
                          variant={r.status === 'valid' ? 'default' : r.status === 'invalid' ? 'outline' : 'secondary'}
                          className="text-[10px] font-bold"
                        >
                          {r.status === 'valid' ? 'Válido' : r.status === 'invalid' ? 'Inválido' : 'Pendiente'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {r.status === 'pending' && (
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => handleUpdateReferralStatus(r.id, 'valid')}
                              className="text-[10px] h-6 px-2 text-accent font-bold cursor-pointer"
                            >
                              Validar
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => handleUpdateReferralStatus(r.id, 'invalid')}
                              className="text-[10px] h-6 px-2 text-destructive font-bold cursor-pointer"
                            >
                              Invalidar
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Drawer de Ajuste Manual de Tickets */}
      <Drawer
        open={isAdjustmentDrawerOpen && Boolean(selectedParticipant)}
        onClose={() => setIsAdjustmentDrawerOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-accent" />
            <span>Ajuste Manual de Boletos</span>
          </div>
        }
        description={`Participante: ${selectedParticipant?.customerName} (Actual: ${selectedParticipant?.totalTickets} tickets)`}
        className="max-w-md"
      >
        <form onSubmit={handleSaveAdjustment} className="space-y-4 pt-1">
          <div>
            <label className="block text-[11px] font-bold text-text-secondary mb-1">
              Cantidad de Boletos (+ para sumar, - para restar) *
            </label>
            <input
              type="number"
              required
              value={adjustmentDelta}
              onChange={(e) => setAdjustmentDelta(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-surface-raised border border-line text-text-primary font-bold font-mono outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-text-secondary mb-1">
              Motivo del Ajuste (Registro de Auditoría) *
            </label>
            <textarea
              rows={2}
              required
              placeholder="Ej. Promoción especial por aniversario, compensación de orden..."
              value={adjustmentReason}
              onChange={(e) => setAdjustmentReason(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-surface-raised border border-line text-text-primary outline-none focus:border-accent resize-none font-medium"
            />
          </div>

          <div className="pt-2 border-t border-line flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsAdjustmentDrawerOpen(false)} className="text-xs rounded-xl">
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createAdjustmentMutation.isPending}
              className="text-xs font-black bg-accent text-white rounded-xl cursor-pointer active:scale-95"
            >
              <Check className="w-3.5 h-3.5 mr-1" />
              Guardar Ajuste
            </Button>
          </div>
        </form>
      </Drawer>

      {/* 5. Drawer Crear Código de Invitado */}
      <Drawer
        open={isCodeDrawerOpen}
        onClose={() => setIsCodeDrawerOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-accent" />
            <span>Crear Código de Invitado</span>
          </div>
        }
        description="Genera un código único para que un cliente invite a amigos y gane boletos extra."
        className="max-w-md"
      >
        <form onSubmit={handleSaveReferralCode} className="space-y-4 pt-1">
          <div>
            <label className="block text-[11px] font-bold text-text-secondary mb-1">
              Nombre del Participante Anfitrión *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Alexis Mendoza"
              value={codeOwnerName}
              onChange={(e) => setCodeOwnerName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-surface-raised border border-line text-text-primary outline-none focus:border-accent font-bold"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-text-secondary mb-1">
              Teléfono de Contacto *
            </label>
            <input
              type="tel"
              required
              placeholder="Ej. 5512345678"
              value={codeOwnerPhone}
              onChange={(e) => setCodeOwnerPhone(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-surface-raised border border-line text-text-primary font-mono outline-none focus:border-accent"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-text-secondary mb-1">
                Palabra Clave
              </label>
              <select
                value={codeBurgerWord}
                onChange={(e) => setCodeBurgerWord(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-surface-raised border border-line text-text-primary outline-none focus:border-accent font-black font-mono"
              >
                {BURGER_WORDS.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-text-secondary mb-1">
                Número
              </label>
              <input
                type="number"
                min="1"
                max="99"
                value={codeNumber}
                onChange={(e) => setCodeNumber(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-surface-raised border border-line text-text-primary font-mono outline-none focus:border-accent font-black"
              />
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleGenerateRandomCode}
            className="w-full text-xs font-bold border-dashed border-accent/40 text-accent hover:bg-accent/10 rounded-xl"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1" />
            Sugerir Combinación Aleatoria
          </Button>

          <div className="pt-2 border-t border-line flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsCodeDrawerOpen(false)} className="text-xs rounded-xl">
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createReferralCodeMutation.isPending}
              className="text-xs font-black bg-accent text-white rounded-xl cursor-pointer active:scale-95"
            >
              <Check className="w-3.5 h-3.5 mr-1" />
              Generar Código
            </Button>
          </div>
        </form>
      </Drawer>

      {/* 6. Drawer Ruleta / Ganador del Sorteo */}
      <Drawer
        open={isWinnerDrawerOpen}
        onClose={() => !isSpinning && setIsWinnerDrawerOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <span>Ruleta de Sorteo Burgers.exe</span>
          </div>
        }
        description="Selección aleatoria ponderada según los boletos acumulados."
        className="max-w-md text-center"
      >
        <div className="space-y-6 pt-2 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center mx-auto">
            <Trophy className="w-8 h-8" />
          </div>

          {isSpinning ? (
            <div className="space-y-3 py-4">
              <h3 className="text-lg font-black text-text-primary animate-pulse">
                {spinningName}
              </h3>
              <p className="text-xs text-text-secondary">
                Mezclando boletos y ponderando probabilidades en vivo...
              </p>
              <div className="w-36 h-1.5 bg-surface-raised rounded-full overflow-hidden mx-auto">
                <div className="w-full h-full bg-amber-500 animate-pulse" />
              </div>
            </div>
          ) : winnerResult ? (
            <div className="space-y-4 py-2 animate-in zoom-in-95 duration-300">
              <Badge variant="default" className="text-xs py-1 px-3 bg-amber-500 text-white font-black">
                🎉 ¡TENEMOS UN GANADOR! 🎉
              </Badge>
              <h3 className="text-2xl font-black text-text-primary">
                {winnerResult.customerName}
              </h3>
              <p className="text-xs font-mono text-text-secondary">
                Teléfono: {winnerResult.customerPhoneMasked}
              </p>
              <div className="inline-flex items-center gap-2 bg-surface-raised px-4 py-2 rounded-2xl border border-line text-xs font-bold text-accent">
                <Ticket className="w-4 h-4" />
                <span>Participó con {winnerResult.totalTickets} boletos</span>
              </div>
            </div>
          ) : null}

          <div className="pt-2">
            <Button
              type="button"
              onClick={() => setIsWinnerDrawerOpen(false)}
              disabled={isSpinning}
              className="text-xs font-black bg-text-primary text-surface-card px-6 rounded-xl cursor-pointer active:scale-95"
            >
              Cerrar Sorteo
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
