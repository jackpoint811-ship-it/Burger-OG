import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface TowerScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTowerKey?: string | null;
}

export function getTowerStatus() {
  const day = new Date().getDay(); // 0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat

  // Mon (1), Wed (3) -> GGA Active
  // Tue (2), Thu (4) -> Valcob Active
  // Fri (5) -> Both Active
  // Sat (6), Sun (0) -> Weekend notice (Default GGA active for demo/weekend)
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

export const TowerScheduleModal: React.FC<TowerScheduleModalProps> = ({
  isOpen,
  onClose,
  selectedTowerKey,
}) => {
  const status = getTowerStatus();
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
                    <span className="tower-item-emoji">🏢</span>
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
                    <span className="tower-item-emoji">🏢</span>
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
