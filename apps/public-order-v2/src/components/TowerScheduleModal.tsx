import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { TowerSchedule, TowerSchedulePublic } from "@config/index";

export interface TowerScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTowerKey?: string | null;
  towers?: (TowerSchedule | TowerSchedulePublic)[];
}

export type DynamicTowerSchedule = TowerSchedulePublic;

const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

function formatActiveDaysText(activeDays: number[]): string {
  if (!activeDays || activeDays.length === 0) return "Ningún día";
  if (activeDays.length === 7) return "Todos los días";
  const sorted = [...activeDays].sort((a, b) => a - b);
  const names = sorted.map((d) => DAY_NAMES[d] ?? "");
  if (names.length === 1) return names[0] ?? "";
  if (names.length === 2) return `${names[0]} y ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} y ${names[names.length - 1]}`;
}

export function getMxNow(): { day: number; hours: number; minutes: number; dateStr: string } {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  };
  const parts = new Intl.DateTimeFormat("en-US", options).formatToParts(now);
  const findPart = (type: string) => parts.find((p) => p.type === type)?.value ?? "0";

  const year = parseInt(findPart("year"), 10);
  const month = parseInt(findPart("month"), 10);
  const day = parseInt(findPart("day"), 10);
  let hours = parseInt(findPart("hour"), 10);
  if (hours === 24) hours = 0;
  const minutes = parseInt(findPart("minute"), 10);

  const dateObj = new Date(Date.UTC(year, month - 1, day));
  const dayOfWeek = dateObj.getUTCDay();
  const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  return { day: dayOfWeek, hours, minutes, dateStr };
}

export function parseCutoffTime(timeStr: string = "13:30"): { hours: number; minutes: number } {
  const parts = timeStr.split(":");
  const hours = parseInt(parts[0] ?? "13", 10);
  const minutes = parseInt(parts[1] ?? "30", 10);
  return { hours: Number.isNaN(hours) ? 13 : hours, minutes: Number.isNaN(minutes) ? 30 : minutes };
}

export function isPastTowerCutoff(orderEndTime: string = "13:30"): boolean {
  const mxNow = getMxNow();
  const cutoff = parseCutoffTime(orderEndTime);
  return mxNow.hours > cutoff.hours || (mxNow.hours === cutoff.hours && mxNow.minutes >= cutoff.minutes);
}

export function isPastServiceCutoffTime(date: Date = new Date()): boolean {
  return isPastTowerCutoff("13:30");
}

export type ComputedTowerItem = {
  key: string;
  name: string;
  emoji: string;
  active: boolean;
  isPaused: boolean;
  isActiveConfig: boolean;
  daysText: string;
  orderStartTime: string;
  orderEndTime: string;
  deliveryStartTime: string;
  deliveryEndTime: string;
  deliveryLabel: string;
};

export function getTowerStatus(dynamicTowers?: (TowerSchedule | TowerSchedulePublic)[]) {
  const mxNow = getMxNow();
  const day = mxNow.day;

  if (dynamicTowers !== undefined) {
    const towersList: ComputedTowerItem[] = dynamicTowers.map((t) => {
      const isPastCutoff = isPastTowerCutoff(t.orderEndTime || "13:30");
      const isConfigActive = t.isActive !== false;
      const isDayActive = Array.isArray(t.activeDays) && t.activeDays.includes(day);
      const active = Boolean(isConfigActive && isDayActive && !isPastCutoff);

      return {
        key: t.towerKey,
        name: t.towerName,
        emoji: t.emoji || "🏢",
        active,
        isPaused: !isConfigActive,
        isActiveConfig: isConfigActive,
        daysText: formatActiveDaysText(t.activeDays),
        orderStartTime: t.orderStartTime || "09:00",
        orderEndTime: t.orderEndTime || "13:30",
        deliveryStartTime: t.deliveryStartTime || "13:30",
        deliveryEndTime: t.deliveryEndTime || "14:00",
        deliveryLabel: t.deliveryLabel || "1:30 PM",
      };
    });

    const isAnyTowerOpen = towersList.some((t) => t.active);
    const pastCutoff = towersList.length > 0 ? towersList.every((t) => isPastTowerCutoff(t.orderEndTime)) : isPastTowerCutoff("13:30");
    const ggaTower = towersList.find((t) => t.key === "gga") || towersList[0];
    const valcobTower = towersList.find((t) => t.key === "valcob") || towersList[1] || towersList[0];

    return {
      day,
      pastCutoff,
      isAnyTowerOpen,
      towersList,
      gga: ggaTower,
      valcob: valcobTower,
    };
  }

  const defaultCutoff = isPastTowerCutoff("13:30");
  const isGgaActive = !defaultCutoff && (day === 1 || day === 3 || day === 5);
  const isValcobActive = !defaultCutoff && (day === 2 || day === 4 || day === 5);

  const defaultList: ComputedTowerItem[] = [
    {
      key: "gga",
      name: "Torre GGA",
      emoji: "🏢",
      active: isGgaActive,
      isPaused: false,
      isActiveConfig: true,
      daysText: "Lunes, Miércoles y Viernes",
      orderStartTime: "09:00",
      orderEndTime: "13:30",
      deliveryStartTime: "13:30",
      deliveryEndTime: "14:00",
      deliveryLabel: "1:30 PM",
    },
    {
      key: "valcob",
      name: "Torre Valcob",
      emoji: "🏢",
      active: isValcobActive,
      isPaused: false,
      isActiveConfig: true,
      daysText: "Martes, Jueves y Viernes",
      orderStartTime: "09:00",
      orderEndTime: "13:30",
      deliveryStartTime: "13:30",
      deliveryEndTime: "14:00",
      deliveryLabel: "1:30 PM",
    },
  ];

  return {
    day,
    pastCutoff: defaultCutoff,
    isAnyTowerOpen: defaultList.some((t) => t.active),
    towersList: defaultList,
    gga: defaultList[0],
    valcob: defaultList[1],
  };
}

export function getNextAvailableDeliveryDate(
  location: string,
  dynamicTowers?: DynamicTowerSchedule[]
): string {
  const mxNow = getMxNow();
  const [year, month, day] = mxNow.dateStr.split("-").map((v) => parseInt(v, 10));

  const targetTower = dynamicTowers?.find((t) => t.towerName === location || t.towerKey === location);
  const activeDays = targetTower
    ? targetTower.activeDays
    : location === "Torre Valcob" || location === "valcob"
    ? [2, 4, 5]
    : [1, 3, 5];

  for (let offset = 1; offset <= 14; offset++) {
    const candidate = new Date(Date.UTC(year, month - 1, day + offset));
    const dayOfWeek = candidate.getUTCDay();

    if (activeDays.includes(dayOfWeek)) {
      return candidate.toISOString().split("T")[0] ?? "";
    }
  }
  return mxNow.dateStr;
}

export const TowerScheduleModal: React.FC<TowerScheduleModalProps> = ({
  isOpen,
  onClose,
  selectedTowerKey,
  towers: propTowers,
}) => {
  const [internalTowers, setInternalTowers] = useState<DynamicTowerSchedule[]>([]);

  useEffect(() => {
    if (!isOpen || propTowers) return;
    fetch("/api/tower-schedules")
      .then((res) => res.json())
      .then((data: any) => {
        if (data?.ok && Array.isArray(data.towers)) {
          setInternalTowers(data.towers);
        }
      })
      .catch(() => {
        /* silent fallback */
      });
  }, [isOpen, propTowers]);

  const effectiveTowers = propTowers ?? internalTowers;
  const status = getTowerStatus(effectiveTowers.length ? effectiveTowers : undefined);
  const focusedTower = selectedTowerKey
    ? status.towersList.find((t) => t.key === selectedTowerKey || t.name === selectedTowerKey) || status.towersList[0]
    : status.towersList[0];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="tower-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
          <motion.div
            className="tower-modal-card"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="tower-modal-header">
              <div className="tower-modal-title-box">
                <span className="tower-modal-icon">🏢</span>
                <div>
                  <h3 className="tower-modal-title">Entregas por Edificio</h3>
                  <p className="tower-modal-subtitle">Horario y disponibilidad de ruta</p>
                </div>
              </div>
              <button
                type="button"
                className="tower-modal-close-btn"
                onClick={onClose}
                aria-label="Cerrar modal"
              >
                ✕
              </button>
            </div>

            {/* Content Body */}
            <div className="tower-modal-body">
              {/* Highlight notice if target tower clicked */}
              {selectedTowerKey && focusedTower && (
                <div className={`tower-modal-status-banner ${focusedTower.isPaused ? "tower-modal-status-banner--inactive" : focusedTower.active ? "tower-modal-status-banner--active" : "tower-modal-status-banner--scheduled"}`}>
                  <span className="tower-modal-status-dot" />
                  <span>
                    {focusedTower.isPaused ? (
                      <><strong>{focusedTower.name}</strong> se encuentra temporalmente pausada por la cocina</>
                    ) : focusedTower.active ? (
                      <><strong>{focusedTower.name}</strong> recibe pedidos hoy 🎉 (hasta las {focusedTower.orderEndTime})</>
                    ) : (
                      <><strong>{focusedTower.name}</strong> recibe pedidos programados ({focusedTower.daysText}) 📅</>
                    )}
                  </span>
                </div>
              )}

              <p className="tower-modal-desc">
                Organizamos las entregas por días para garantizar pedidos calientes y express a tu oficina:
              </p>

              {/* Towers Schedule Grid */}
              <div className="tower-schedule-list">
                {status.towersList.map((t) => (
                  <div key={t.key || t.name} className={`tower-schedule-item ${t.active ? "tower-schedule-item--active" : "tower-schedule-item--inactive"}`}>
                    <div className="tower-item-left">
                      <span className="tower-item-emoji">{t.emoji}</span>
                      <div>
                        <h4 className="tower-item-name">{t.name}</h4>
                        <span className="tower-item-days">
                          {t.isPaused ? "Servicio temporalmente pausado" : `${t.daysText} (${t.orderStartTime} a ${t.orderEndTime})`}
                        </span>
                      </div>
                    </div>
                    <span className={`tower-badge-pill ${t.isPaused ? "tower-badge-pill--off" : t.active ? "tower-badge-pill--active" : "tower-badge-pill--scheduled"}`}>
                      {t.isPaused ? "🔴 Pausado" : t.active ? "🟢 Disponible Hoy" : "📅 Programar Entrega"}
                    </span>
                  </div>
                ))}
              </div>

              <div className="tower-modal-footer-note">
                <span aria-hidden="true">💡</span>
                <p>
                  ¿Tu edificio no recibe pedidos hoy? ¡No te preocupes! Puedes armar y programar tu pedido con anticipación las 24 horas y lo entregamos puntual en su próxima ruta.
                </p>
              </div>
            </div>

            {/* Action button */}
            <div className="tower-modal-actions">
              <button type="button" className="tower-modal-confirm-btn" onClick={onClose}>
                Entendido
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
