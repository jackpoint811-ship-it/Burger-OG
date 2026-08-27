/**
 * RafflesAdminPanel.tsx — PR-V3-12
 *
 * Submódulo de Administración de Sorteos, Rifas y Sistema de Referidos.
 * Incluye asignación de tickets por compra/referido, ajustes manuales, códigos de invitado,
 * gestión de campaña y selector aleatorio de ganador.
 */

import React, { useState, useMemo } from 'react';
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
  Sliders,
  Dice5,
  RefreshCw,
  Edit2,
  Trash2,
  Flame,
} from 'lucide-react';
import type { RaffleParticipantSummary, RaffleCampaignV2 } from '@config/index';
import { Button } from '@ui/button';
import { Badge } from '@ui/badge';
import { Card } from '@ui/card';
import { useAdminRaffles } from '../../features/admin/hooks/use-admin';
import type {
  CreateTicketAdjustmentAdminPayload,
  CreateReferralCodeAdminPayload,
  UpdateRaffleCampaignAdminPayload,
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
  const [activeTab, setActiveTab] = useState<'participants' | 'codes' | 'referrals' | 'settings'>('participants');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

  // Sincronizar activeToolId con activeTab
  React.useEffect(() => {
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
    createCampaignMutation,
    updateCampaignMutation,
    createAdjustmentMutation,
    createReferralCodeMutation,
    updateReferralCodeMutation,
    updateReferralMutation,
  } = useAdminRaffles(selectedCampaignId, searchQuery);

  // Modals state
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [isWinnerModalOpen, setIsWinnerModalOpen] = useState(false);
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

  // Filtered Participants
  const participants = useMemo(() => {
    if (!summary?.participantResults) return summary?.topParticipants || [];
    return summary.participantResults;
  }, [summary]);

  const handleOpenAdjustment = (participant: RaffleParticipantSummary) => {
    setSelectedParticipant(participant);
    setAdjustmentDelta('1');
    setAdjustmentReason('');
    setIsAdjustmentModalOpen(true);
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
      setIsAdjustmentModalOpen(false);
      setNotice(`Ajuste de ${delta > 0 ? `+${delta}` : delta} tickets guardado.`);
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
      setIsCodeModalOpen(false);
      setNotice('Código de invitado creado con éxito.');
      setTimeout(() => setNotice(null), 3000);
    } catch {
      // Handled
    }
  };

  const handleToggleCodeActive = async (id: string, currentActive: boolean) => {
    try {
      await updateReferralCodeMutation.mutateAsync({ id, payload: { isActive: !currentActive } });
      setNotice(`Código ${!currentActive ? 'activado' : 'pausado'}`);
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

  // Winner Randomizer (Weighted by tickets)
  const handleStartDraw = () => {
    if (!participants || participants.length === 0) return;
    setIsWinnerModalOpen(true);
    setIsSpinning(true);
    setWinnerResult(null);

    // Build ticket pool
    const pool: RaffleParticipantSummary[] = [];
    participants.forEach((p) => {
      const tickets = Math.max(1, p.totalTickets || 1);
      for (let i = 0; i < tickets; i++) {
        pool.push(p);
      }
    });

    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * pool.length);
      setWinnerResult(pool[randomIndex] || participants[0] || null);
      setIsSpinning(false);
    }, 2800);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Notice */}
      {notice && (
        <div className="p-3 rounded-2xl bg-accent-soft border border-accent/20 text-accent text-xs font-bold flex items-center justify-between">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="opacity-70 hover:opacity-100">
            ×
          </button>
        </div>
      )}

      {/* Active Campaign Header Card */}
      <div className="bg-surface-card p-6 rounded-3xl border border-line shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-accent-soft text-accent flex items-center justify-center font-bold shrink-0">
            <Gift className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge variant="default" className="text-xs">
                {activeCampaign ? (activeCampaign.isActive ? 'Campaña Activa' : 'Campaña Pausada') : 'Sin Campaña'}
              </Badge>
              {activeCampaign && (
                <span className="text-xs text-text-secondary font-mono">
                  {activeCampaign.ticketPerBurger} ticket/burger · {activeCampaign.ticketPerReferral} tickets/referido
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-text-primary">
              {activeCampaign?.title || 'Sorteo Burgers.exe'}
            </h3>
            <p className="text-xs text-text-secondary">
              {activeCampaign?.description || 'Gana premios acumulando boletos con cada hamburguesa o referido.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <Button
            type="button"
            onClick={handleStartDraw}
            disabled={!participants || participants.length === 0}
            className="text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs"
          >
            <Dice5 className="w-4 h-4 mr-1.5" />
            Sortear Ganador
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => refetchSummary()}
            className="p-2 h-9 w-9 text-text-secondary"
            title="Refrescar datos"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-3xl bg-surface-card border border-line shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-text-secondary flex items-center gap-1">
            <Ticket className="w-3.5 h-3.5 text-accent" />
            Boletos Totales
          </span>
          <p className="text-2xl font-bold text-accent">{summary?.totalTickets ?? 0}</p>
          <div className="text-[10px] text-text-muted flex gap-2">
            <span>🍔 Base: {summary?.baseTickets ?? 0}</span>
            <span>🎁 Extra: {summary?.extraTickets ?? 0}</span>
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-surface-card border border-line shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-text-secondary flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-text-muted" />
            Participantes
          </span>
          <p className="text-2xl font-bold text-text-primary">{summary?.totalParticipants ?? 0}</p>
          <p className="text-[10px] text-text-muted">Con al menos 1 boleto</p>
        </div>

        <div className="p-4 rounded-3xl bg-surface-card border border-line shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-text-secondary flex items-center gap-1">
            <LinkIcon className="w-3.5 h-3.5 text-text-muted" />
            Códigos de Invitado
          </span>
          <p className="text-2xl font-bold text-text-primary">{referralCodes.length}</p>
          <p className="text-[10px] text-text-muted">{referralCodes.filter((c) => c.isActive).length} activos</p>
        </div>

        <div className="p-4 rounded-3xl bg-surface-card border border-line shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-text-secondary flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            Top Líder
          </span>
          <p className="text-sm font-bold text-text-primary truncate">
            {summary?.topParticipants?.[0]?.customerName || '—'}
          </p>
          <p className="text-[10px] text-accent font-bold">
            {summary?.topParticipants?.[0] ? `${summary.topParticipants[0].totalTickets} boletos` : 'Sin participantes'}
          </p>
        </div>
      </div>

      {/* Sub-Tabs de Navegación */}
      <div className="flex items-center gap-2 border-b border-line pb-3 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('participants')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'participants'
              ? 'bg-text-primary text-surface-card shadow-xs'
              : 'bg-surface-card text-text-secondary hover:text-text-primary border border-line'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Participantes ({participants.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('codes')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'codes'
              ? 'bg-text-primary text-surface-card shadow-xs'
              : 'bg-surface-card text-text-secondary hover:text-text-primary border border-line'
          }`}
        >
          <LinkIcon className="w-3.5 h-3.5" />
          <span>Códigos de Invitado ({referralCodes.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('referrals')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'referrals'
              ? 'bg-text-primary text-surface-card shadow-xs'
              : 'bg-surface-card text-text-secondary hover:text-text-primary border border-line'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Pedidos Referidos ({referrals.length})</span>
        </button>
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
                className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-surface-card border border-line text-text-primary outline-none focus:border-accent"
              />
            </div>
            <span className="text-xs text-text-secondary self-end sm:self-auto">
              Mostrando {participants.length} participantes
            </span>
          </div>

          <div className="bg-surface-card rounded-3xl border border-line overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-line bg-surface-raised/50 text-[11px] font-bold text-text-secondary">
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
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 text-xs font-black">1° Lugar</span>
                          ) : idx === 1 ? (
                            <span className="px-2 py-0.5 rounded-md bg-slate-500/15 text-slate-600 dark:text-slate-400 text-xs font-black">2° Lugar</span>
                          ) : idx === 2 ? (
                            <span className="px-2 py-0.5 rounded-md bg-amber-700/15 text-amber-800 dark:text-amber-300 text-xs font-black">3° Lugar</span>
                          ) : (
                            `${idx + 1}°`
                          )}
                        </td>
                        <td className="py-3 px-4 font-bold text-text-primary">
                          {p.customerName}
                          {p.lastOrderFolio && (
                            <span className="block text-[10px] font-normal text-text-muted">
                              Último pedido: #{p.lastOrderFolio}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-text-secondary">
                          {p.customerPhoneMasked || '—'}
                        </td>
                        <td className="py-3 px-4 text-center font-semibold text-text-primary">
                          {p.burgerTickets}
                        </td>
                        <td className="py-3 px-4 text-center font-semibold text-text-primary">
                          {p.referralTickets}
                        </td>
                        <td className="py-3 px-4 text-center font-semibold text-text-secondary">
                          {p.manualExtraTickets > 0 ? `+${p.manualExtraTickets}` : p.manualExtraTickets}
                        </td>
                        <td className="py-3 px-4 text-center font-extrabold text-accent text-sm">
                          {p.totalTickets} tickets
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => handleOpenAdjustment(p)}
                            className="text-xs h-7 px-2.5 rounded-lg font-bold"
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

      {/* TAB 2: Códigos de Referido */}
      {activeTab === 'codes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-sm font-bold text-text-primary">Códigos Registrados para Compartir</h4>
            <Button
              type="button"
              onClick={() => {
                setCodeOwnerName('');
                setCodeOwnerPhone('');
                setIsCodeModalOpen(true);
              }}
              className="text-xs font-bold bg-accent text-white"
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
                    <span className="text-base font-extrabold font-mono text-accent bg-accent-soft px-3 py-1 rounded-xl">
                      {code.code}
                    </span>
                    <Badge variant={code.isActive ? 'default' : 'outline'} className="text-[10px]">
                      {code.isActive ? 'Activo' : 'Pausado'}
                    </Badge>
                  </div>

                  <div>
                    <h5 className="text-xs font-bold text-text-primary">{code.ownerName}</h5>
                    <p className="text-[11px] text-text-secondary font-mono">{code.ownerPhoneMasked}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-line flex items-center justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleToggleCodeActive(code.id, code.isActive)}
                    className="text-xs h-7 px-2.5 rounded-lg"
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
        <div className="bg-surface-card rounded-3xl border border-line overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-line bg-surface-raised/50 text-[11px] font-bold text-text-secondary">
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
                      <td className="py-3 px-4 font-mono font-bold text-accent">
                        {r.code}
                      </td>
                      <td className="py-3 px-4 text-text-primary">
                        {r.referrerName}
                      </td>
                      <td className="py-3 px-4 text-text-primary">
                        {r.referredCustomerName}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-accent">
                        +{r.ticketsAwarded}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge
                          variant={r.status === 'valid' ? 'success' : r.status === 'invalid' ? 'destructive' : 'secondary'}
                          className="text-[10px]"
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
                              className="text-[10px] h-6 px-2 text-accent"
                            >
                              Validar
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => handleUpdateReferralStatus(r.id, 'invalid')}
                              className="text-[10px] h-6 px-2 text-destructive"
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

      {/* Modal Ajuste Manual de Tickets */}
      {isAdjustmentModalOpen && selectedParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface-card w-full max-w-md rounded-3xl border border-line shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-text-primary">Ajuste Manual de Boletos</h3>
            <p className="text-xs text-text-secondary">
              Participante: <span className="font-bold text-text-primary">{selectedParticipant.customerName}</span> (Total actual: {selectedParticipant.totalTickets} tickets)
            </p>

            <form onSubmit={handleSaveAdjustment} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Cantidad de Tickets (+ o -) *
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
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Motivo del Ajuste (Auditoría) *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Ej. Promoción especial por aniversario, compensación..."
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-surface-raised border border-line text-text-primary outline-none focus:border-accent resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsAdjustmentModalOpen(false)} className="text-xs">
                  Cancelar
                </Button>
                <Button type="submit" className="text-xs font-bold bg-accent text-white">
                  Guardar Ajuste
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Crear Código de Invitado */}
      {isCodeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface-card w-full max-w-md rounded-3xl border border-line shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-text-primary">Crear Código de Invitado</h3>

            <form onSubmit={handleSaveReferralCode} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Nombre del Participante *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Alexis Mendoza"
                  value={codeOwnerName}
                  onChange={(e) => setCodeOwnerName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-surface-raised border border-line text-text-primary outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
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
                  <label className="block text-xs font-semibold text-text-secondary mb-1">
                    Palabra Clave
                  </label>
                  <select
                    value={codeBurgerWord}
                    onChange={(e) => setCodeBurgerWord(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-surface-raised border border-line text-text-primary outline-none focus:border-accent font-bold font-mono"
                  >
                    {BURGER_WORDS.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">
                    Número
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={codeNumber}
                    onChange={(e) => setCodeNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-surface-raised border border-line text-text-primary font-mono outline-none focus:border-accent font-bold"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCodeModalOpen(false)} className="text-xs">
                  Cancelar
                </Button>
                <Button type="submit" className="text-xs font-bold bg-accent text-white">
                  Generar Código
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ruleta / Ganador */}
      {isWinnerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-surface-card w-full max-w-lg rounded-3xl border border-line shadow-2xl p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center mx-auto animate-bounce">
              <Trophy className="w-8 h-8" />
            </div>

            {isSpinning ? (
              <div className="space-y-3 py-4">
                <h3 className="text-lg font-bold text-text-primary animate-pulse">
                  Mezclando boletos y seleccionando ganador...
                </h3>
                <p className="text-xs text-text-secondary">
                  Ponderando probabilidades según la cantidad de tickets acumulados.
                </p>
                <div className="w-32 h-1 bg-surface-raised rounded-full overflow-hidden mx-auto">
                  <div className="w-full h-full bg-amber-500 animate-indeterminate" />
                </div>
              </div>
            ) : winnerResult ? (
              <div className="space-y-4 py-2 animate-in zoom-in-95 duration-300">
                <Badge variant="default" className="text-xs py-1 px-3 bg-amber-500 text-white">
                  ¡TENEMOS UN GANADOR!
                </Badge>
                <h3 className="text-2xl font-extrabold text-text-primary">
                  {winnerResult.customerName}
                </h3>
                <p className="text-sm font-mono text-text-secondary">
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
                onClick={() => setIsWinnerModalOpen(false)}
                disabled={isSpinning}
                className="text-xs font-bold bg-text-primary text-surface-card px-6"
              >
                Cerrar Sorteo
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
