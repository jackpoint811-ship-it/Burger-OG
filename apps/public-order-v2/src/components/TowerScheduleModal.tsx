import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface TowerScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTowerKey?: string | null;
}

export type DynamicTowerSchedule = {
  towerKey: string;
  towerName: string;
  emoji: string;
  activeDays: number[];
  orderStartTime: string;
  orderEndTime: string;
  deliveryStartTime: string;
  deliveryEndTime: string;
  deliveryLabel: string | null;
  isActive: boolean;
};

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

export function getTowerStatus(dynamicTowers?: DynamicTowerSchedule[]) {
  const day = new Date().getDay();

  if (dynamicTowers && dynamicTowers.length > 0) {
    const ggaTower = dynamicTowers.find((t) => t.towerKey === "gga");
    const valcobTower = dynamicTowers.find((t) => t.towerKey === "valcob");

    const ggaActive = ggaTower ? ggaTower.isActive && (ggaTower.activeDays.includes(day) || day === 0 || day === 6) : true;
    const valcobActive = valcobTower ? valcobTower.isActive && valcobTower.activeDays.includes(day) : true;

    return {
      day,
      gga: {
        name: ggaTower?.towerName ?? "Torre GGA",
        emoji: ggaTower?.emoji ?? "🏢",
        active: ggaActive,
        daysText: ggaTower ? formatActiveDaysText(ggaTower.activeDays) : "Lunes, Miércoles y Viernes",
      },
      valcob: {
        name: valcobTower?.towerName ?? "Torre Valcob",
        emoji: valcobTower?.emoji ?? "🏢",
        active: valcobActive,
        daysText: valcobTower ? formatActiveDaysText(valcobTower.activeDays) : "Martes, Jueves y Viernes",
      },
    };
  }

  const isGgaActive = day === 1 || day === 3 || day === 5 || day === 6 || day === 0;
  const isValcobActive = day === 2 || day === 4 || day === 5;

  return {
    day,
    gga: {
      name: "Torre GGA",
      emoji: "🏢",
      active: isGgaActive,
      daysText: "Lunes, Miércoles y Viernes",
    },
    valcob: {
      name: "Torre Valcob",
      emoji: "🏢",
      active: isValcobActive,
      daysText: "Martes, Jueves y Viernes",
    },
  };
}

export function getNextAvailableDeliveryDate(location: "Torre GGA" | "Torre Valcob"): string {
  const today = new Date();
  const result = new Date(today);

  for (let offset = 1; offset <= 7; offset++) {
    result.setDate(today.getDate() + offset);
    const day = result.getDay();
    const isValidGga = day === 1 || day === 3 || day === 5;
    const isValidValcob = day === 2 || day === 4 || day === 5;

    if (location === "Torre GGA" && isValidGga) {
      return result.toISOString().split("T")[0] ?? "";
    }
    if (location === "Torre Valcob" && isValidValcob) {
      return result.toISOString().split("T")[0] ?? "";
    }
  }
  return result.toISOString().split("T")[0] ?? "";
}

export const TowerScheduleModal: React.FC<TowerScheduleModalProps> = ({
  isOpen,
  onClose,
  selectedTowerKey,
}) => {
  const [towers, setTowers] = useState<DynamicTowerSchedule[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    fetch("/api/tower-schedules")
      .then((res) => res.json())
      .then((data: any) => {
        if (data?.ok && Array.isArray(data.towers)) {
          setTowers(data.towers);
        }
      })
      .catch(() => {
        /* silent fallback */
      });
  }, [isOpen]);

  const status = getTowerStatus(towers);
  const focusedTower = selectedTowerKey === "valcob" ? status.valcob : status.gga;

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
              {selectedTowerKey && (
                <div className={`tower-modal-status-banner ${focusedTower.active ? "tower-modal-status-banner--active" : "tower-modal-status-banner--inactive"}`}>
                  <span className="tower-modal-status-dot" />
                  <span>
                    <strong>{focusedTower.name}</strong> {focusedTower.active ? "recibe pedidos hoy 🎉" : "no recibe pedidos hoy"}
                  </span>
                </div>
              )}

              <p className="tower-modal-desc">
                Organizamos las entregas por días para garantizar pedidos calientes y express a tu oficina:
              </p>

              {/* Towers Schedule Grid */}
              <div className="tower-schedule-list">
                {/* Torre GGA */}
                <div className={`tower-schedule-item ${status.gga.active ? "tower-schedule-item--active" : "tower-schedule-item--inactive"}`}>
                  <div className="tower-item-left">
                    <span className="tower-item-emoji">{status.gga.emoji}</span>
                    <div>
                      <h4 className="tower-item-name">{status.gga.name}</h4>
                      <span className="tower-item-days">{status.gga.daysText}</span>
                    </div>
                  </div>
                  <span className={`tower-badge-pill ${status.gga.active ? "tower-badge-pill--active" : "tower-badge-pill--off"}`}>
                    {status.gga.active ? "🟢 Disponible Hoy" : "⚪ Inactivo Hoy"}
                  </span>
                </div>

                {/* Torre Valcob */}
                <div className={`tower-schedule-item ${status.valcob.active ? "tower-schedule-item--active" : "tower-schedule-item--inactive"}`}>
                  <div className="tower-item-left">
                    <span className="tower-item-emoji">{status.valcob.emoji}</span>
                    <div>
                      <h4 className="tower-item-name">{status.valcob.name}</h4>
                      <span className="tower-item-days">{status.valcob.daysText}</span>
                    </div>
                  </div>
                  <span className={`tower-badge-pill ${status.valcob.active ? "tower-badge-pill--active" : "tower-badge-pill--off"}`}>
                    {status.valcob.active ? "🟢 Disponible Hoy" : "⚪ Inactivo Hoy"}
                  </span>
                </div>
              </div>

              <div className="tower-modal-footer-note">
                <span aria-hidden="true">💡</span>
                <p>
                  Si tu edificio no recibe pedidos hoy, puedes programar tu pedido con anticipación durante la confirmación de la orden.
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
